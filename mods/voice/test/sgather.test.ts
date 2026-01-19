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
import { StartStreamGatherRequest, StreamGatherSource } from "@fonoster/common";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox, match } from "sinon";
import sinonChai from "sinon-chai";
import { getVoiceObject, mediaSessionRef, voiceRequest } from "./helpers";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/SGather", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create an transcription stream", async function () {
    // Arrange
    const { StartStreamGather } = await import("../src/verbs/StreamGather");

    const voice = getVoiceObject(sandbox, "startStreamGatherResponse");

    const startStreamGather = new StartStreamGather(voiceRequest, voice);

    const startStreamGatherRequest: StartStreamGatherRequest = {
      mediaSessionRef,
      source: StreamGatherSource.SPEECH
    };

    // Act
    await startStreamGather.run(startStreamGatherRequest);

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      startStreamGatherRequest
    });
  });

  it("should stream transcriptions from the server", async function () {
    // Arrange
    const { VoiceResponse } = await import("../src/VoiceResponse");

    const onStub = sandbox
      .stub()
      .onFirstCall()
      .callsFake((_, cb) => {
        cb({ content: "startStreamGatherResponse" });
      });

    const voice = {
      removeListener: sandbox.stub(),
      on: onStub,
      once: sandbox.stub(),
      write: sandbox.stub(),
      end: sandbox.stub()
    };
    const voiceResponse = new VoiceResponse(voiceRequest, voice);

    const dummyCallback = sandbox.stub();

    // Act
    const sGather = await voiceResponse.sgather({
      source: StreamGatherSource.SPEECH
    });

    // This will be called twice
    sGather.onPayload(dummyCallback);

    // First payload in
    voice.on.yield({
      streamGatherPayload: {
        data: { speech: "Hi there!" }
      }
    });

    // Second payload in
    voice.on.yield({
      streamGatherPayload: {
        data: { speech: "How are you?" }
      }
    });

    // Assert
    expect(dummyCallback).to.have.been.calledTwice;

    expect(dummyCallback).to.have.been.calledWith({
      data: { speech: "Hi there!" }
    });

    expect(dummyCallback).to.have.been.calledWith({
      data: { speech: "How are you?" }
    });
  });
});
