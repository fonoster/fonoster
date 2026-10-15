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
// Replays the turn-taking corpus through the baseline Detector and a candidate, and prints the
// report (add-turn-taking task 1.6).
//
//   npx tsx mods/gateway/scripts/replay.ts [corpus.json]
import * as fs from "fs";
import * as path from "path";
import { BackchannelDetector } from "../src/turn/BackchannelDetector";
import { Corpus } from "../src/turn/corpus";
import { BaselineDetector } from "../src/turn/Detector";
import { compare, replay, ReplayReport } from "../src/turn/replay";

const file =
  process.argv[2] ??
  path.join(
    __dirname,
    "..",
    "..",
    "conformance",
    "turn-corpus",
    "synthetic-v1.json"
  );
const corpus = JSON.parse(fs.readFileSync(file, "utf8")) as Corpus;

const baseline = replay(
  corpus.calls,
  () => new BaselineDetector({ silenceTimeoutMs: 600 })
);
const candidate = replay(
  corpus.calls,
  () => new BackchannelDetector({ silenceTimeoutMs: 600 })
);

const row = (name: string, r: ReplayReport) =>
  [
    name,
    r.falseCutOffRate,
    r.delayMedianMs,
    r.delayP95Ms,
    r.missedBargeInRate,
    r.backchannelMisfireRate
  ].join("\t");
console.log(
  `corpus: ${path.basename(file)}, ${baseline.calls} calls, ${baseline.turns} turns\n`
);
console.log(
  [
    "detector",
    "falseCutOff",
    "delayMedian",
    "delayP95",
    "missedBargeIn",
    "backchannelMisfire"
  ].join("\t")
);
console.log(row("baseline", baseline));
console.log(row("backchannel-hold", candidate));
console.log(
  "\ncandidate vs baseline:",
  JSON.stringify(compare(baseline, candidate))
);
