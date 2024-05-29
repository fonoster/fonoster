/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import chai, { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, sessionRef, voiceRequest } from "./helpers";
import { GatherSource, SGatherRequest } from "../src/verbs";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/sgather", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new SGather instance", async function () {
    // Arrange
    const { SGather } = await import("../src/verbs/SGather");

    const voice = getVoiceObject(sandbox);

    const sgather = new SGather(voiceRequest, voice);

    const sgatherRequest: SGatherRequest = {
      sessionRef,
      source: GatherSource.SPEECH_AND_DTMF
    };

    // Act
    await sgather.run({
      sessionRef,
      source: GatherSource.SPEECH_AND_DTMF
    });

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      // FIXME: Should return "sgatherRequest" instead of "sGatherRequest"
      sgatherRequest
    });
  });

  it("should return a stream of gather speech or dtmf", async function () {
    // Arrange
    const { VoiceResponse } = await import("../src/VoiceResponse");

    const voice = getVoiceObject(sandbox);

    const voiceResponse = new VoiceResponse(voiceRequest, voice);

    // Act
    const stream = await voiceResponse.sgather();

    // // Assert
    expect(stream).to.have.property("on");
    expect(stream).to.have.property("close");
  });
});
