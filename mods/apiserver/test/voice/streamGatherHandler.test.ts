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
import { StreamGatherSource } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getCreateVoiceClient } from "./helper";
import { createStreamGatherHandler } from "../../src/voice/handlers/createStreamGatherHandler";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/handler/StreamHeader", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should handle the StreamGather command", async function () {
    // Arrange
    const createVoiceClient = getCreateVoiceClient(sandbox);

    const streamGatherRequest = {
      mediaSessionRef: "mediaSessionRef",
      source: "speech"
    };

    const voiceClient = createVoiceClient();

    // Act
    await createStreamGatherHandler(voiceClient)(streamGatherRequest);

    // Assert
    expect(voiceClient.startSpeechGather).to.have.been.calledOnce;
    expect(voiceClient.startSpeechGather).to.have.been.calledWith(match.func);
    expect(voiceClient.startDtmfGather).to.not.have.been.called;
  });

  it("should handle the StreamGather command with DTMF", async function () {
    // Arrange
    const createVoiceClient = getCreateVoiceClient(sandbox);

    const streamGatherRequest = {
      mediaSessionRef: "mediaSessionRef",
      source: StreamGatherSource.SPEECH_AND_DTMF
    };

    const voiceClient = createVoiceClient();

    // Act
    await createStreamGatherHandler(voiceClient)(streamGatherRequest);

    // Assert
    expect(voiceClient.startDtmfGather).to.have.been.calledOnce;
    expect(voiceClient.startDtmfGather).to.have.been.calledWith(
      "mediaSessionRef",
      match.func
    );
    expect(voiceClient.startSpeechGather).to.have.been.calledOnce;
  });
});
