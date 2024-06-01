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
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/VoiceDispatcher", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  // it("should handle a ChannelDtmfReceived event", async function () {
  //   // Arrange
  //   const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
  //   const ari = {
  //     on: sandbox.stub(),
  //     start: sandbox.stub()
  //   };
  //   const createVoiceClient = sandbox.stub().returns({
  //     config: {
  //       sessionId: channelId
  //     },
  //     sendRespnse: sandbox.stub()
  //   });
  //   const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
  //   const event = {
  //     digit: "1"
  //   };
  //   const channel = {
  //     id: channelId,
  //     getChannelVar: sandbox.stub().resolves({ value: "value" })
  //   };
  //   voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

  //   // Act
  //   voiceDispatcher.handleChannelDtmfReceived(event, channel);

  //   // Assert
  //   expect(createVoiceClient().sendDtmfReceivedEvent).to.have.been.calledOnce;
  //   expect(createVoiceClient().sendDtmfReceivedEvent).to.have.been.calledWith(
  //     event.digit
  //   );
  // });

  // it("should handle a PlaybackFinished event", async function () {
  //   // Arrange
  //   const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
  //   const ari = {
  //     on: sandbox.stub(),
  //     start: sandbox.stub()
  //   };
  //   const createVoiceClient = sandbox.stub().returns({
  //     config: {
  //       sessionId: channelId
  //     },
  //     sendPlaybackFinishedEvent: sandbox.stub()
  //   });
  //   const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
  //   const event = {
  //     playback: {
  //       id: "playback-id"
  //     }
  //   };
  //   const channel = {
  //     id: channelId,
  //     getChannelVar: sandbox.stub().resolves({ value: "value" })
  //   };
  //   voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

  //   // Act
  //   voiceDispatcher.handlePlaybackFinished(event, channel);

  //   // Assert
  //   expect(createVoiceClient().sendPlaybackFinishedEvent).to.have.been
  //     .calledOnce;
  //   expect(
  //     createVoiceClient().sendPlaybackFinishedEvent
  //   ).to.have.been.calledWith(event.playback.id);
  // });

  // it("should handle a RecordingFinished event", async function () {
  //   // Arrange
  //   const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
  //   const ari = {
  //     on: sandbox.stub(),
  //     start: sandbox.stub()
  //   };
  //   const createVoiceClient = sandbox.stub().returns({
  //     config: {
  //       sessionId: channelId
  //     },
  //     sendRecordingFinishedEvent: sandbox.stub()
  //   });
  //   const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
  //   const event = {
  //     recording: {
  //       name: "recording-name",
  //       duration: 10,
  //       format: FileFormat.SLIN16,
  //       silence_duration: 1,
  //       talking_duration: 9
  //     }
  //   };
  //   const channel = {
  //     id: channelId,
  //     getChannelVar: sandbox.stub().resolves({ value: "value" })
  //   };
  //   voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

  //   // Act
  //   voiceDispatcher.handleRecordingFinished(event, channel);

  //   // Assert
  //   expect(createVoiceClient().sendRecordingFinishedEvent).to.have.been
  //     .calledOnce;
  //   expect(
  //     createVoiceClient().sendRecordingFinishedEvent
  //   ).to.have.been.calledWith(event.recording);
  // });

  // it("should handle a RecordingFailed event", async function () {
  //   // Arrange
  //   const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
  //   const ari = {
  //     on: sandbox.stub(),
  //     start: sandbox.stub()
  //   };
  //   const createVoiceClient = sandbox.stub().returns({
  //     config: {
  //       sessionId: channelId
  //     },
  //     sendRecordingFailedEvent: sandbox.stub()
  //   });
  //   const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
  //   const event = {
  //     recording: {
  //       cause: "unknown"
  //     }
  //   };
  //   const channel = {
  //     id: channelId,
  //     getChannelVar: sandbox.stub().resolves({ value: "value" })
  //   };
  //   voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

  //   // Act
  //   voiceDispatcher.handleRecordingFailed(event, channel);

  //   // Assert
  //   expect(createVoiceClient().sendRecordingFailedEvent).to.have.been
  //     .calledOnce;
  //   expect(
  //     createVoiceClient().sendRecordingFailedEvent
  //   ).to.have.been.calledWith(event.recording.cause);
  // });
});
