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
import { GatherSource, StreamGatherRequest } from "../src/verbs";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/verbs/streamGather", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a new StreamGather instance", async function () {
    // Arrange
    const { StreamGather } = await import("../src/verbs/StreamGather");

    const voice = getVoiceObject(sandbox);

    const streamGather = new StreamGather(voiceRequest, voice);

    const streamGatherRequest: StreamGatherRequest = {
      sessionRef,
      source: GatherSource.SPEECH_AND_DTMF
    };

    // Act
    await streamGather.run({
      sessionRef,
      source: GatherSource.SPEECH_AND_DTMF
    });

    // Assert
    expect(voice.removeListener).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledOnce;
    expect(voice.on).to.have.been.calledWith("data", match.func);
    expect(voice.write).to.have.been.calledOnce;
    expect(voice.write).to.have.been.calledWith({
      streamGatherRequest
    });
  });

  it("should return a stream of gather speech or dtmf", async function () {
    // Arrange
    const { VoiceResponse } = await import("../src/VoiceResponse");

    const onStub = sandbox
      .stub()
      .onFirstCall()
      .callsFake((_, cb) => {
        cb({});
      });

    const voice = {
      removeListener: sandbox.stub(),
      on: onStub,
      write: sandbox.stub(),
      end: sandbox.stub()
    };
    const voiceResponse = new VoiceResponse(voiceRequest, voice);

    const dummyCallback = sandbox.stub();

    // Act
    const stream = await voiceResponse.streamGather();

    stream.on("transcript", dummyCallback);
    stream.on("dtmf", dummyCallback);

    voice.on.yield({ streamGatherResponse: { speech: "hello" } });
    voice.on.yield({ streamGatherResponse: { speech: "world" } });
    voice.on.yield({ streamGatherResponse: { digits: "1" } });
    voice.on.yield({ streamGatherResponse: { digits: "2" } });

    // Assert
    expect(dummyCallback).to.have.been.callCount(4);
  });
});
