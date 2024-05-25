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
import {
  AriClient,
  AriEvent,
  Channel,
  ChannelDtmfReceivedEvent,
  PlaybackFinishedEvent,
  RecordingFailedEvent,
  RecordingFinishedEvent,
  StasisStartEvent,
  VoiceClient
} from "./types";

const STATIS_APP_NAME = "mediacontroller";

class VoiceDispatcher {
  voiceClients: Map<string, VoiceClient>;
  ari: AriClient;
  createVoiceClient: (event: StasisStartEvent, channel: Channel) => VoiceClient;

  constructor(
    ari: AriClient,
    createVoiceClient: (
      event: StasisStartEvent,
      channel: Channel
    ) => VoiceClient
  ) {
    this.ari = ari;
    this.voiceClients = new Map();
    this.createVoiceClient = createVoiceClient;
  }

  start() {
    // Initialize the ARI client
    this.ari.on(AriEvent.STASIS_START, this.handleStasisStart.bind(this));
    this.ari.on(AriEvent.STASIS_END, this.handleStasisEnd.bind(this));
    this.ari.start(STATIS_APP_NAME);

    // Register event handlers
    this.ari.on(
      AriEvent.CHANNEL_DTMF_RECEIVED,
      this.handleChannelDtmfReceived.bind(this)
    );
    this.ari.on(
      AriEvent.PLAYBACK_FINISHED,
      this.handlePlaybackFinished.bind(this)
    );
    this.ari.on(
      AriEvent.RECORDING_FINISHED,
      this.handleRecordingFinished.bind(this)
    );
    this.ari.on(
      AriEvent.RECORDING_FAILED,
      this.handleRecordingFailed.bind(this)
    );

    // Register command handlers
  }

  handleStasisStart(event: StasisStartEvent, channel: Channel) {
    const voiceClient = this.createVoiceClient(event, channel);
    this.voiceClients.set(event.channel.id, voiceClient);
  }

  handleStasisEnd(_: undefined, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.close();
      this.voiceClients.delete(channel.id);
    }
  }

  handleChannelDtmfReceived(event: ChannelDtmfReceivedEvent, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.sendDtmfReceivedEvent(event.digit);
    }
  }

  handlePlaybackFinished(event: PlaybackFinishedEvent, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.sendPlaybackFinishedEvent(event.playback.id);
    }
  }

  handleRecordingFinished(event: RecordingFinishedEvent, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.sendRecordingFinishedEvent(event.recording);
    }
  }

  handleRecordingFailed(event: RecordingFailedEvent, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.sendRecordingFailedEvent(event.recording.cause);
    }
  }
}

export { VoiceDispatcher };
