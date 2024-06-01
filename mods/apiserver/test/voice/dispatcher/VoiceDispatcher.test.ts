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
import { AriEvent } from "../../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

describe("@voice/dispatcher/VoiceDispatcher", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it.skip("should create a VoiceDispatcher", async function () {
    // Arrange
    const { VoiceDispatcher } = await import(
      "../../../src/voice/VoiceDispatcher"
    );
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub();
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);

    // Act
    voiceDispatcher.start();

    // Assert
    expect(ari.on).to.have.been.called.callCount(6);
    expect(ari.on).to.have.been.calledWith(
      AriEvent.STASIS_START,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleStasisStart";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.STASIS_END,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleStasisEnd";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.CHANNEL_DTMF_RECEIVED,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleChannelDtmfReceived";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.PLAYBACK_FINISHED,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handlePlaybackFinished";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.RECORDING_FINISHED,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleRecordingFinished";
        })
      )
    );
    expect(ari.on).to.have.been.calledWith(
      AriEvent.RECORDING_FAILED,
      match.func.and(
        match(function (fn) {
          return fn.name === "bound handleRecordingFailed";
        })
      )
    );
    expect(ari.start).to.have.been.calledOnce;
    expect(ari.start).to.have.been.calledWith("mediacontroller");
  });
});
