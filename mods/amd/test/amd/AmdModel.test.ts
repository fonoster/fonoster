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
import { AmdStatus } from "@fonoster/common";
import { expect } from "chai";
import {
  classifyPcm,
  mapLabelToStatus,
  softmaxTop
} from "../../src/amd/AmdModel";

const FIXTURES = join(__dirname, "fixtures");

describe("@amd/AmdModel", function () {
  describe("mapLabelToStatus", function () {
    const cases: [string | undefined, AmdStatus][] = [
      ["human", AmdStatus.HUMAN],
      ["person", AmdStatus.HUMAN],
      ["voicemail", AmdStatus.VOICEMAIL],
      ["voice mail", AmdStatus.VOICEMAIL],
      ["IVR", AmdStatus.IVR],
      ["menu", AmdStatus.IVR],
      ["machine", AmdStatus.MACHINE],
      ["answering_machine", AmdStatus.MACHINE],
      ["Answering Machine", AmdStatus.MACHINE],
      ["gibberish", AmdStatus.UNKNOWN],
      [undefined, AmdStatus.UNKNOWN]
    ];
    cases.forEach(([label, expected]) => {
      it(`maps ${JSON.stringify(label)} -> ${expected}`, function () {
        expect(mapLabelToStatus(label)).to.equal(expected);
      });
    });
  });

  describe("softmaxTop", function () {
    it("returns the argmax index and its probability", function () {
      const { index, confidence } = softmaxTop([1, 3, 0, -2]);
      expect(index).to.equal(1);
      expect(confidence).to.be.greaterThan(0.5).and.lessThan(1);
    });
  });

  describe("classifyPcm (bundled ONNX model)", function () {
    it("classifies the reference clip into a valid status", async function () {
      this.timeout(30000);
      const pcm = readFileSync(join(FIXTURES, "fixture.pcm"));
      const expected = JSON.parse(
        readFileSync(join(FIXTURES, "fixture_expected.json"), "utf8")
      ) as { argmax: number; id2label: Record<string, string> };

      const result = await classifyPcm(pcm);

      expect(Object.values(AmdStatus)).to.include(result.status);
      expect(result.confidence).to.be.within(0, 1);
      expect(result.detector).to.be.a("string").and.not.empty;

      // End-to-end parity: JS features + ONNX should land on the same class the
      // Python reference did.
      expect(result.status).to.equal(
        mapLabelToStatus(expected.id2label[String(expected.argmax)])
      );
    });
  });
});
