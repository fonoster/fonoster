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
// Replays the turn-taking corpus through the default Detector (baseline) and candidates, and
// prints the report (add-turn-taking tasks 1.6, TT-B9). The baseline stays the default; a
// candidate's PASS only says it may be proposed as the default.
//
//   npx tsx mods/appbridge/scripts/replay.ts [corpus.json] [--candidate backchannel-hold]...
//       [--patience low|normal|high] [--no-adapt] [--json]
import * as fs from "fs";
import * as path from "path";
import { Corpus } from "../src/turn/corpus";
import { createDetector, DETECTORS } from "../src/turn/createDetector";
import { Patience } from "../src/turn/Pacing";
import { formatReport, replay } from "../src/turn/replay";

const args = process.argv.slice(2);
const flag = (name: string) => args.includes(name);
const values = (name: string) =>
  args.flatMap((a, i) => (a === name && args[i + 1] ? [args[i + 1]] : []));
const positional = args.filter(
  (a, i) =>
    !a.startsWith("--") &&
    !args[i - 1]?.startsWith("--c") &&
    !args[i - 1]?.startsWith("--p")
);

const file =
  positional[0] ??
  path.join(
    __dirname,
    "..",
    "..",
    "conformance",
    "turn-corpus",
    "synthetic-v1.json"
  );
const corpus = JSON.parse(fs.readFileSync(file, "utf8")) as Corpus;
const candidates = values("--candidate");
for (const c of candidates)
  if (!(DETECTORS as readonly string[]).includes(c))
    throw new Error(`unknown detector ${c} (${DETECTORS.join(", ")})`);
const options = {
  patience: (values("--patience")[0] ?? "normal") as Patience,
  adapt: !flag("--no-adapt")
};
const run = (name: string) => ({
  name,
  report: replay(
    corpus.calls,
    () => createDetector({ silenceTimeoutMs: 600, detector: name }).detector,
    options
  )
});

const reports = [
  "baseline",
  ...(candidates.length ? candidates : ["backchannel-hold"])
].map(run);
if (flag("--json")) console.log(JSON.stringify(reports, null, 2));
else {
  console.log(
    `corpus: ${path.basename(file)}, patience ${options.patience}, adaptation ${options.adapt ? "on" : "off"}\n`
  );
  console.log(formatReport(reports));
}
