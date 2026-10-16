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
import { readFileSync } from "fs";
import { join } from "path";
import { expect } from "chai";
import { classifyPcm } from "../../src/amd/AmdModel";

const FIXTURES_DIR = join(__dirname, "..", "fixtures", "regression");

type ManifestEntry = {
  file: string;
  groundTruthLabel: string;
  knownStatus: string;
  knownConfidence: number;
  note: string;
};

const manifest = JSON.parse(
  readFileSync(join(FIXTURES_DIR, "manifest.json"), "utf8")
) as { entries: ManifestEntry[] };

/**
 * Pins the classifier's output on a small, permanently-stored, licensed
 * corpus covering all four labels (human/voicemail/ivr/answering_machine),
 * so a change to the model, the bundled weights, or the feature extractor
 * that silently shifts a result gets caught here rather than in production.
 *
 * This asserts against each fixture's recorded baseline (manifest.json's
 * knownStatus/knownConfidence) — NOT against groundTruthLabel. Two fixtures
 * are known accuracy gaps (see manifest.json's `note`); asserting against
 * groundTruthLabel there would make this a flaky accuracy test instead of a
 * stable regression test. Confidence gets a wide tolerance since minor
 * numeric drift (ONNX Runtime version, platform) is expected and not a
 * regression on its own — a status flip is the signal that matters.
 */
describe("@amd/regression (permanent labeled corpus)", function () {
  manifest.entries.forEach((entry) => {
    it(`${entry.file}: stays ${entry.knownStatus} (ground truth: ${entry.groundTruthLabel})`, async function () {
      this.timeout(30000);
      const pcm = readFileSync(join(FIXTURES_DIR, entry.file));
      const result = await classifyPcm(pcm);

      expect(result.status).to.equal(entry.knownStatus);
      expect(result.confidence).to.be.closeTo(entry.knownConfidence, 0.1);
    });
  });
});
