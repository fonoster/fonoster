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
import { createHash } from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Rules, TraceRecord } from "@routr/common/dist/trace";
import { classifyCall, findFailure, hasEnded } from "./classifyCall";
import { parseCall } from "./readCall";
import { FarEnd } from "./types";

// Reads the Routr recordings modified in the last window, reports each far end
// x interop case found for the first time (evidence) and each far end x failure
// signature at most once a UTC day (failures), and appends both to
// <state>/alerts.jsonl. <state>/state.json remembers what was reported.

export interface ScanOptions {
  traces: string;
  farEnds: FarEnd[];
  state: string;
  sinceMs: number;
  now?: Date;
}

export interface ScanResult {
  lines: string[];
}

interface State {
  found: Record<string, Record<string, { file: string; time: string }>>;
  failures: Record<string, Record<string, string>>;
}

/** Thrown when the state folder can't be written; the CLI exits 1. */
export class StateWriteError extends Error {}

const SAFE_NAME = /^[0-9A-Za-z:.-]+-[A-Za-z0-9._@-]{1,128}\.jsonl$/;

// The recording's name when it is safe to show; the name embeds the Call-ID
// the caller chose, so anything else becomes its time and a short hash.
function safeName(name: string, records: TraceRecord[]): string {
  if (SAFE_NAME.test(name)) return name;
  const hash = createHash("sha256").update(name).digest("hex").slice(0, 12);
  const at = (records[0]?.recordedAt ?? "unknown").replace(
    /[^0-9A-Za-z:.-]/g,
    ""
  );
  return `${at}-${hash}.jsonl`;
}

function errorFindings(records: TraceRecord[]): string[] {
  const findings = Rules.evaluateAll(records, {
    profiles: ["sip", "sip-connect"] as never
  });
  const ids = [...findings.values()]
    .flat()
    .filter((f) => f.severity === "error")
    .map((f) => f.rule);
  return [...new Set(ids)].sort();
}

function readState(dir: string): State {
  const file = path.join(dir, "state.json");
  if (!fs.existsSync(file)) return { found: {}, failures: {} };
  const s = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<State>;
  return { found: s.found ?? {}, failures: s.failures ?? {} };
}

function writeState(dir: string, state: State): void {
  const file = path.join(dir, "state.json");
  const tmp = path.join(dir, `.state.json.${process.pid}`);
  try {
    fs.writeFileSync(tmp, `${JSON.stringify(state)}\n`);
    fs.renameSync(tmp, file);
  } catch (e) {
    throw new StateWriteError(`cannot write ${file}: ${(e as Error).message}`);
  }
}

function appendAlert(dir: string, alert: object): void {
  const fd = fs.openSync(path.join(dir, "alerts.jsonl"), "a");
  try {
    fs.writeSync(fd, `${JSON.stringify(alert)}\n`);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
}

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

// Regular files (no symlinks) modified within the window, oldest first.
function recentFiles(dir: string, from: number) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isFile() && d.name.endsWith(".jsonl"))
    .map((d) => ({
      name: d.name,
      mtime: fs.statSync(path.join(dir, d.name)).mtimeMs
    }))
    .filter((f) => f.mtime >= from)
    .sort((a, b) => a.mtime - b.mtime || a.name.localeCompare(b.name));
}

export function scan(opts: ScanOptions): ScanResult {
  const now = opts.now ?? new Date();
  const time = now.toISOString().replace(/\.\d{3}Z$/, "Z");
  const today = time.slice(0, 10);
  const state = readState(opts.state);
  const files = recentFiles(opts.traces, now.getTime() - opts.sinceMs);
  const lines: string[] = [];
  const failing = new Map<
    string,
    {
      farEnd: string;
      signature: string;
      count: number;
      file: string;
      findings: string[];
    }
  >();
  let registers = 0;
  let classified = 0;
  let fresh = 0;

  files.forEach(({ name }) => {
    let text: string;
    try {
      text = fs.readFileSync(path.join(opts.traces, name), "utf8");
    } catch {
      return; // gone since the listing (retention) or unreadable: skipped
    }
    if (firstLineIsRegister(text)) {
      registers++;
      return;
    }
    const records = parseCall(text);
    if (!hasEnded(records)) return;

    const match = classifyCall(records, opts.farEnds);
    if (match) {
      classified++;
      const seen = state.found[match.farEnd]?.[match.case];
      if (!seen) {
        const file = safeName(name, records);
        const findings = errorFindings(records);
        appendAlert(opts.state, {
          time,
          kind: "evidence",
          far_end: match.farEnd,
          case: match.case,
          file,
          findings
        });
        state.found[match.farEnd] = {
          ...state.found[match.farEnd],
          [match.case]: { file, time }
        };
        writeState(opts.state, state);
        fresh++;
        lines.push(
          `new ${match.farEnd} ${match.case} ${file} findings=${findings.join(",") || "-"}`
        );
      }
    }

    const failure = findFailure(records, opts.farEnds);
    if (failure) {
      const key = `${failure.farEnd}\n${failure.signature}`;
      const group = failing.get(key);
      if (group) group.count++;
      else
        failing.set(key, {
          ...failure,
          count: 1,
          file: safeName(name, records),
          findings: errorFindings(records)
        });
    }
  });

  failing.forEach((g) => {
    lines.push(`failure ${g.farEnd} ${g.signature} count=${g.count} ${g.file}`);
    if (state.failures[g.farEnd]?.[g.signature] === today) return;
    appendAlert(opts.state, {
      time,
      kind: "failure",
      far_end: g.farEnd,
      signature: g.signature,
      count: g.count,
      file: g.file,
      findings: g.findings
    });
    state.failures[g.farEnd] = {
      ...state.failures[g.farEnd],
      [g.signature]: today
    };
    writeState(opts.state, state);
  });

  lines.push(
    `scanned ${files.length} files: ${registers} REGISTER, ${classified} calls classified, ${fresh} new, ${failing.size} failing`
  );
  return { lines };
}
