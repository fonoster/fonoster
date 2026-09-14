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
import { AmdStatus } from "@fonoster/common";
import { expect } from "chai";
import { buildAmdVariables, parseMode } from "../../src/amd/buildAmdVariables";
import { ProbeResult } from "../../src/probe/runProbe";

const classified = (
  status: AmdStatus,
  confidence: number
): ProbeResult => ({
  kind: "classified",
  status,
  confidence,
  detector: "whisper-telephony-amd",
  latencyMs: 42,
  speechOnsetMs: 1300
});

const unknown = (cause: string): ProbeResult => ({
  kind: "unknown",
  cause,
  latencyMs: 42
});

describe("@amd/buildAmdVariables", function () {
  describe("parseMode", function () {
    it('treats "full" as full mode', function () {
      expect(parseMode("full")).to.equal("full");
    });

    [undefined, "", "compact", "FULL", "full ", "garbage"].forEach((raw) => {
      it(`treats ${JSON.stringify(raw)} as compact mode`, function () {
        expect(parseMode(raw)).to.equal("compact");
      });
    });
  });

  describe("compact mode", function () {
    const cases: [AmdStatus, string, string][] = [
      [AmdStatus.HUMAN, "HUMAN", "HUMAN"],
      [AmdStatus.MACHINE, "MACHINE", "MACHINE-MACHINE"],
      [AmdStatus.VOICEMAIL, "MACHINE", "MACHINE-VOICEMAIL"],
      [AmdStatus.IVR, "MACHINE", "MACHINE-IVR"]
    ];

    cases.forEach(([status, amdstatus, amdcause]) => {
      it(`maps ${status} at high confidence -> AMDSTATUS=${amdstatus} AMDCAUSE=${amdcause}`, function () {
        const result = buildAmdVariables(classified(status, 0.95), "compact", 0.8);
        expect(result).to.deep.equal({
          AMDSTATUS: amdstatus,
          AMDCAUSE: amdcause
        });
      });
    });

    it("downgrades a below-threshold confidence to NOTSURE/ML-LOW-CONFIDENCE", function () {
      const result = buildAmdVariables(
        classified(AmdStatus.VOICEMAIL, 0.42),
        "compact",
        0.8
      );
      expect(result).to.deep.equal({
        AMDSTATUS: "NOTSURE",
        AMDCAUSE: "ML-LOW-CONFIDENCE"
      });
    });

    it("maps a classified-but-UNKNOWN-label status to NOTSURE/ML-UNKNOWN-LABEL, not ML-LOW-CONFIDENCE, even at high confidence", function () {
      const result = buildAmdVariables(
        classified(AmdStatus.UNKNOWN, 0.95),
        "compact",
        0.8
      );
      expect(result).to.deep.equal({
        AMDSTATUS: "NOTSURE",
        AMDCAUSE: "ML-UNKNOWN-LABEL"
      });
    });

    it("passes an unknown result's cause through as NOTSURE", function () {
      const result = buildAmdVariables(unknown("ML-TIMEOUT"), "compact", 0.8);
      expect(result).to.deep.equal({ AMDSTATUS: "NOTSURE", AMDCAUSE: "ML-TIMEOUT" });
    });

    it("only ever produces AMDSTATUS/AMDCAUSE — nothing native AMD() wouldn't set", function () {
      const result = buildAmdVariables(
        classified(AmdStatus.HUMAN, 0.99),
        "compact",
        0.8
      );
      expect(Object.keys(result).sort()).to.deep.equal(["AMDCAUSE", "AMDSTATUS"]);
    });
  });

  describe("full mode", function () {
    it("reports the classifier's own status untouched, regardless of confidence", function () {
      const result = buildAmdVariables(
        classified(AmdStatus.VOICEMAIL, 0.1),
        "full",
        0.8 // minConfidence is ignored in full mode
      );
      expect(result).to.deep.equal({
        AMDSTATUS: "VOICEMAIL",
        AMDCAUSE: "VOICEMAIL",
        AMDCONFIDENCE: "0.1000",
        AMDDETECTOR: "whisper-telephony-amd",
        AMDLATENCYMS: "42",
        AMDSPEECHONSETMS: "1300"
      });
    });

    it("reports IVR untouched (never collapsed to MACHINE)", function () {
      const result = buildAmdVariables(classified(AmdStatus.IVR, 0.88), "full", 0.8);
      expect(result.AMDSTATUS).to.equal("IVR");
    });

    it("reports UNKNOWN with the diagnostic cause and zeroed measurements on a fail-open path", function () {
      const result = buildAmdVariables(unknown("ML-NO-AUDIO"), "full", 0.8);
      expect(result).to.deep.equal({
        AMDSTATUS: "UNKNOWN",
        AMDCAUSE: "ML-NO-AUDIO",
        AMDCONFIDENCE: "0",
        AMDDETECTOR: "",
        AMDLATENCYMS: "42",
        AMDSPEECHONSETMS: ""
      });
    });

    it("reports the speech onset on an unknown result when speech had started", function () {
      const result = buildAmdVariables(
        { kind: "unknown", cause: "ML-TIMEOUT", latencyMs: 42, speechOnsetMs: 3440 },
        "full",
        0.8
      );
      expect(result).to.include({ AMDCAUSE: "ML-TIMEOUT", AMDSPEECHONSETMS: "3440" });
    });
  });
});
