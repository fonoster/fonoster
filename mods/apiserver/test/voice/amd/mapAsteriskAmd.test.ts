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
import { AmdStatus } from "@fonoster/common";
import { expect } from "chai";
import {
  DETECTOR,
  mapAsteriskAmd
} from "../../../src/voice/amd/mapAsteriskAmd";

describe("@voice/amd/mapAsteriskAmd", function () {
  it("should map a live answer to HUMAN with full confidence", function () {
    // Arrange, Act
    const amd = mapAsteriskAmd("HUMAN");

    // Assert
    expect(amd).to.deep.equal({
      status: AmdStatus.HUMAN,
      confidence: 1,
      detector: DETECTOR,
      latencyMs: 0
    });
  });

  it("should map a machine answer to MACHINE with full confidence", function () {
    // Arrange, Act
    const amd = mapAsteriskAmd("MACHINE");

    // Assert
    expect(amd).to.deep.include({
      status: AmdStatus.MACHINE,
      confidence: 1
    });
  });

  it("should map an inconclusive analysis to UNKNOWN with no confidence", function () {
    // Arrange, Act
    const amd = mapAsteriskAmd("NOTSURE");

    // Assert
    expect(amd).to.deep.include({
      status: AmdStatus.UNKNOWN,
      confidence: 0
    });
  });

  it("should map a hangup during analysis to UNKNOWN with no confidence", function () {
    // Arrange, Act
    const amd = mapAsteriskAmd("HANGUP");

    // Assert
    expect(amd).to.deep.include({
      status: AmdStatus.UNKNOWN,
      confidence: 0
    });
  });

  it("should never report VOICEMAIL or IVR, which app_amd cannot detect", function () {
    // Arrange
    const statuses = ["HUMAN", "MACHINE", "NOTSURE", "HANGUP"];

    // Act
    const results = statuses.map((status) => mapAsteriskAmd(status)?.status);

    // Assert
    expect(results).to.not.include(AmdStatus.VOICEMAIL);
    expect(results).to.not.include(AmdStatus.IVR);
  });

  it("should return undefined when AMD did not run", function () {
    // Arrange, Act, Assert
    expect(mapAsteriskAmd(undefined)).to.be.undefined;
    expect(mapAsteriskAmd("")).to.be.undefined;
  });

  it("should return undefined for a status it does not recognize", function () {
    // Arrange, Act, Assert
    expect(mapAsteriskAmd("SOMETHING_ELSE")).to.be.undefined;
  });

  it("should tolerate casing and surrounding whitespace", function () {
    // Arrange, Act
    const amd = mapAsteriskAmd(" human ");

    // Assert
    expect(amd?.status).to.equal(AmdStatus.HUMAN);
  });
});
