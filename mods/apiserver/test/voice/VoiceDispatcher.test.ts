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
import { AriEvent, FileFormat } from "../../src/voice/types";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const channelId = "channel-id";

describe("@voice/VoiceDispatcher", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("should create a VoiceDispatcher", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
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

  it("should handle a StasisStart event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };

    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      }
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const event = {
      channel: {
        id: channelId,
        caller: {
          name: "John Doe",
          number: "+17853178070"
        }
      }
    };
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };

    // Act
    await voiceDispatcher.handleStasisStart(event, channel);

    // Assert
    expect(createVoiceClient).to.have.been.calledOnce;
    expect(voiceDispatcher.voiceClients.get(channelId)).to.exist;
  });

  it("should handle a StasisEnd event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      },
      close: sandbox.stub()
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };
    voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

    // Act
    voiceDispatcher.handleStasisEnd(undefined, channel);

    // Assert
    expect(createVoiceClient().close).to.have.been.calledOnce;
    expect(voiceDispatcher.voiceClients.get(channelId)).to.not.exist;
    expect(channel.getChannelVar).to.have.been.not.called;
  });

  it("should handle a ChannelDtmfReceived event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      },
      sendDtmfReceivedEvent: sandbox.stub()
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const event = {
      digit: "1"
    };
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };
    voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

    // Act
    voiceDispatcher.handleChannelDtmfReceived(event, channel);

    // Assert
    expect(createVoiceClient().sendDtmfReceivedEvent).to.have.been.calledOnce;
    expect(createVoiceClient().sendDtmfReceivedEvent).to.have.been.calledWith(
      event.digit
    );
  });

  it("should handle a PlaybackFinished event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      },
      sendPlaybackFinishedEvent: sandbox.stub()
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const event = {
      playback: {
        id: "playback-id"
      }
    };
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };
    voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

    // Act
    voiceDispatcher.handlePlaybackFinished(event, channel);

    // Assert
    expect(createVoiceClient().sendPlaybackFinishedEvent).to.have.been
      .calledOnce;
    expect(
      createVoiceClient().sendPlaybackFinishedEvent
    ).to.have.been.calledWith(event.playback.id);
  });

  it("should handle a RecordingFinished event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      },
      sendRecordingFinishedEvent: sandbox.stub()
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const event = {
      recording: {
        name: "recording-name",
        duration: 10,
        format: FileFormat.SLIN16,
        silence_duration: 1,
        talking_duration: 9
      }
    };
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };
    voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

    // Act
    voiceDispatcher.handleRecordingFinished(event, channel);

    // Assert
    expect(createVoiceClient().sendRecordingFinishedEvent).to.have.been
      .calledOnce;
    expect(
      createVoiceClient().sendRecordingFinishedEvent
    ).to.have.been.calledWith(event.recording);
  });

  it("should handle a RecordingFailed event", async function () {
    // Arrange
    const { VoiceDispatcher } = await import("../../src/voice/VoiceDispatcher");
    const ari = {
      on: sandbox.stub(),
      start: sandbox.stub()
    };
    const createVoiceClient = sandbox.stub().returns({
      config: {
        sessionId: channelId
      },
      sendRecordingFailedEvent: sandbox.stub()
    });
    const voiceDispatcher = new VoiceDispatcher(ari, createVoiceClient);
    const event = {
      recording: {
        cause: "unknown"
      }
    };
    const channel = {
      id: channelId,
      getChannelVar: sandbox.stub().resolves({ value: "value" })
    };
    voiceDispatcher.voiceClients.set(channelId, createVoiceClient());

    // Act
    voiceDispatcher.handleRecordingFailed(event, channel);

    // Assert
    expect(createVoiceClient().sendRecordingFailedEvent).to.have.been
      .calledOnce;
    expect(
      createVoiceClient().sendRecordingFailedEvent
    ).to.have.been.calledWith(event.recording.cause);
  });
});
