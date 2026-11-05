/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { promises as fs } from "fs";
import * as path from "path";
import { Interop } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";

// One pass over Routr's recordings, inside the API server: it yields to the
// event loop after each file, and writes <state>/state.json once, at the end of
// a complete pass. Each pass reads only what was modified since the last one.

const logger = getLogger({ service: "ops", filePath: __filename });

/** The recordings Routr writes: <stamp>-<Call-ID>.jsonl. */
export const SAFE_NAME = /^[0-9A-Za-z:.-]+-[A-Za-z0-9._@-]{1,128}\.jsonl$/;

const MAX_BYTES = 5 * 1024 * 1024;

export interface Found {
  file: string;
  time: string;
}

export interface Failure extends Found {
  day: string;
  files: string[];
}

export interface State {
  lastRun?: string;
  found: Record<string, Record<string, Found>>;
  failures: Record<string, Record<string, Failure>>;
}

export const stateFile = (dir: string) => path.join(dir, "state.json");

/** No file yet means nothing found yet; anything else unreadable rejects. */
export async function readState(dir: string): Promise<State> {
  let text: string;
  try {
    text = await fs.readFile(stateFile(dir), "utf8");
  } catch (e) {
    if ((e as { code?: string }).code === "ENOENT") {
      return { found: {}, failures: {} };
    }
    throw e;
  }
  return JSON.parse(text) as State;
}

async function writeState(dir: string, state: State): Promise<void> {
  const tmp = path.join(dir, `.state.json.${process.pid}`);
  await fs.writeFile(tmp, `${JSON.stringify(state)}\n`);
  await fs.rename(tmp, stateFile(dir));
}

const seconds = (at: Date) => at.toISOString().replace(/\.\d{3}Z$/, "Z");

function firstLineIsRegister(text: string): boolean {
  const end = text.indexOf("\n");
  try {
    return (
      JSON.parse(end < 0 ? text : text.slice(0, end)).method === "REGISTER"
    );
  } catch {
    return false;
  }
}

// Regular files (no symlinks) with a safe name, modified since `from`, oldest first.
async function filesSince(dir: string, from: number) {
  const files: { name: string; mtime: Date }[] = [];
  for (const name of await fs.readdir(dir)) {
    if (!SAFE_NAME.test(name)) continue;
    try {
      const stat = await fs.lstat(path.join(dir, name));
      if (stat.isFile() && stat.size <= MAX_BYTES && stat.mtimeMs >= from) {
        files.push({ name, mtime: stat.mtime });
      }
    } catch {
      logger.warn(`ops: interop scan skipped ${name}`);
    }
  }
  return files.sort(
    (a, b) =>
      a.mtime.getTime() - b.mtime.getTime() || a.name.localeCompare(b.name)
  );
}

function addFailure(
  state: State,
  farEnd: string,
  signature: string,
  name: string,
  mtime: Date
): void {
  const time = seconds(mtime);
  const day = time.slice(0, 10);
  const entry = state.failures[farEnd]?.[signature];
  if (entry && day < entry.day) return;
  if (!entry || day > entry.day) {
    state.failures[farEnd] = {
      ...state.failures[farEnd],
      [signature]: { day, files: [name], file: name, time }
    };
    return;
  }
  if (!entry.files.includes(name)) entry.files.push(name);
  if (time >= entry.time) {
    entry.file = name;
    entry.time = time;
  }
}

function report(
  state: State,
  text: string,
  name: string,
  mtime: Date,
  farEnds: Interop.FarEnd[]
): void {
  if (firstLineIsRegister(text)) return;
  const records = Interop.parseCall(text);
  if (!Interop.hasEnded(records)) return;

  const match = Interop.classifyCall(records, farEnds);
  if (match && !state.found[match.farEnd]?.[match.case]) {
    state.found[match.farEnd] = {
      ...state.found[match.farEnd],
      [match.case]: { file: name, time: seconds(mtime) }
    };
  }
  const failure = Interop.findFailure(records, farEnds);
  if (failure) {
    addFailure(state, failure.farEnd, failure.signature, name, mtime);
  }
}

export async function scan(opts: {
  traces: string;
  state: string;
  farEnds: Interop.FarEnd[];
}): Promise<void> {
  const start = new Date();
  const state = await readState(opts.state);
  const from = state.lastRun ? Date.parse(state.lastRun) : 0;

  for (const { name, mtime } of await filesSince(opts.traces, from)) {
    try {
      const text = await fs.readFile(path.join(opts.traces, name), "utf8");
      report(state, text, name, mtime, opts.farEnds);
    } catch {
      logger.warn(`ops: interop scan skipped ${name}`);
    }
    await new Promise((resolve) => setImmediate(resolve));
  }

  await writeState(opts.state, {
    lastRun: seconds(start),
    found: state.found,
    failures: state.failures
  });
}
