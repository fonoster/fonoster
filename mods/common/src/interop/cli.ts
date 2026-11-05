#!/usr/bin/env node
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
import { classifyCall } from "./classifyCall";
import { loadFarEnds } from "./farEnds";
import { readCall } from "./readCall";
import { FarEnd } from "./types";

// fonoster-interop: which far end and interop case a Routr recording shows
// (mods/conformance/catalog/areas/interop.md). Prints only the far end and the
// case id, never SIP content.

const USAGE = `usage: fonoster-interop classify <recording.jsonl> --far-ends <far-ends.json>`;

export interface Io {
  out: (line: string) => void;
  err: (line: string) => void;
}

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

function classify(args: string[], io: Io): number {
  const file = args[0];
  const farEndsPath = option(args, "--far-ends");
  if (!file || file.startsWith("--") || !farEndsPath) {
    io.err(USAGE);
    return 2;
  }
  let farEnds: FarEnd[];
  try {
    farEnds = loadFarEnds(farEndsPath);
  } catch (e) {
    io.err(
      `fonoster-interop: bad far ends in ${farEndsPath}: ${(e as Error).message}`
    );
    return 1;
  }
  let match;
  try {
    match = classifyCall(readCall(file), farEnds);
  } catch {
    io.err(`fonoster-interop: cannot read ${file}`);
    return 1;
  }
  io.out(match ? `${match.farEnd} ${match.case}` : "- -");
  return 0;
}

/** Runs the command line; returns the exit code. */
export function run(argv: string[], io: Io): number {
  const [command, ...args] = argv;
  if (command === "classify") return classify(args, io);
  io.err(USAGE);
  return 2;
}

// eslint-disable-next-line no-undef
if (require.main === module) {
  process.exitCode = run(process.argv.slice(2), {
    out: (l) => process.stdout.write(`${l}\n`),
    err: (l) => process.stderr.write(`${l}\n`)
  });
}
