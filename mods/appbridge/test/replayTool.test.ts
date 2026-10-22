/*
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
import { execFile } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { promisify } from "util";
import { expect } from "chai";
import { createDetector } from "../src/turn/createDetector";

// turn-taking "Detectors are compared by replay before adoption": the replay tool
// (`npm run replay -w @fonoster/appbridge`), run as a process on a corpus file, judges a candidate
// Detector against the default and reads only consented calls.
const run = promisify(execFile);
const SCRIPT = path.join(__dirname, "..", "scripts", "replay.ts");

/** Runs the replay tool on a corpus; resolves with what it printed. */
async function replayTool(corpus: unknown, ...args: string[]) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "turn-corpus-"));
  const file = path.join(dir, "corpus.json");
  fs.writeFileSync(file, JSON.stringify(corpus));
  try {
    const { stdout } = await run(
      process.execPath,
      ["--import", "tsx", SCRIPT, file, ...args],
      { env: { ...process.env, LOGS_LEVEL: "none" } }
    );
    return stdout;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/** The agent talks for 6 s; the caller says "stop" over it for 300 ms, a real barge-in. */
const bargeIn = (name: string, consent: string) => ({
  name,
  consent,
  language: "en",
  segments: [
    { startMs: 3000, endMs: 3300, text: "stop", kind: "interruption" },
    { startMs: 9000, endMs: 10500, text: "I need help", kind: "turn", turn: 1 }
  ],
  agent: [{ startMs: 2000, endMs: 8000, interruptible: true }]
});

/** A clean turn, nothing else. */
const clean = (name: string, consent: string) => ({
  name,
  consent,
  language: "en",
  segments: [
    { startMs: 500, endMs: 2000, text: "hello", kind: "turn", turn: 1 }
  ],
  agent: []
});

const CORPUS = (calls: unknown[]) => ({
  format: "fonoster.turn-corpus.v1",
  calls
});

describe("@appbridge turn-taking replay tool", function () {
  this.timeout(60_000);

  it("[APB-040] marks a candidate that regresses beyond the tolerance as failing, and the default stays", async function () {
    // backchannel-hold waits 500 ms before calling speech an interruption, so a 300 ms barge-in
    // is missed: its missed barge-in rate regresses from the baseline's 0.
    const out = await replayTool(
      CORPUS([bargeIn("en-barge-in-1", "synthetic")]),
      "--candidate",
      "backchannel-hold"
    );
    expect(out).to.match(/backchannel-hold vs baseline: FAIL/);
    expect(out).to.match(/missedBargeInRate 1 > baseline 0/);
    expect(out).not.to.match(/may become the default/);
    // Nothing is adopted: a Detector nobody chose is still the baseline.
    expect(
      createDetector({ silenceTimeoutMs: 600 }).version.startsWith("baseline")
    ).to.equal(true);
  });

  it("[APB-040] leaves calls from customers who did not opt in out of the corpus", async function () {
    const out = await replayTool(
      CORPUS([
        clean("en-clean-1", "synthetic"),
        clean("en-clean-2", "internal"),
        clean("en-clean-3", "customer-opt-in"),
        bargeIn("en-barge-in-1", "customer"),
        clean("en-clean-4", "unknown")
      ]),
      "--json"
    );
    const [baseline] = JSON.parse(out) as {
      name: string;
      report: { calls: number; results: { name: string }[] };
    }[];
    expect(baseline.name).to.equal("baseline");
    expect(baseline.report.calls).to.equal(3);
    expect(baseline.report.results.map((r) => r.name)).to.deep.equal([
      "en-clean-1",
      "en-clean-2",
      "en-clean-3"
    ]);
  });
});
