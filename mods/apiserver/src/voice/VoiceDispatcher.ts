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
  PlayRequest,
  StreamContent as SC,
  VerbRequest
} from "@fonoster/common";
import { nanoid } from "nanoid";
import {
  AriClient,
  AriEvent,
  Channel,
  StasisStartEvent,
  VoiceClient
} from "./types";

const STATIS_APP_NAME = "mediacontroller";

class VoiceDispatcher {
  voiceClients: Map<string, VoiceClient>;
  ari: AriClient;
  createVoiceClient: (
    event: StasisStartEvent,
    channel: Channel
  ) => Promise<VoiceClient>;

  constructor(
    ari: AriClient,
    createVoiceClient: (
      event: StasisStartEvent,
      channel: Channel
    ) => Promise<VoiceClient>
  ) {
    this.ari = ari;
    this.voiceClients = new Map();
    this.createVoiceClient = createVoiceClient;
  }

  start() {
    // Initialize the ARI client
    this.ari.start(STATIS_APP_NAME);
    this.ari.on(AriEvent.STASIS_START, this.handleStasisStart.bind(this));
    this.ari.on(AriEvent.STASIS_END, this.handleStasisEnd.bind(this));

    // Register event handlers
    // this.ari.on(
    //   AriEvent.CHANNEL_DTMF_RECEIVED,
    //   this.handleChannelDtmfReceived.bind(this)
    // );
    // this.ari.on(
    //   AriEvent.PLAYBACK_FINISHED,
    //   this.handlePlaybackFinished.bind(this)
    // );
    // this.ari.on(
    //   AriEvent.RECORDING_FINISHED,
    //   this.handleRecordingFinished.bind(this)
    // );
    // this.ari.on(
    //   AriEvent.RECORDING_FAILED,
    //   this.handleRecordingFailed.bind(this)
    // );

    // Register command handlers
  }

  async handleStasisStart(event: StasisStartEvent, channel: Channel) {
    const voiceClient = await this.createVoiceClient(event, channel);

    // Connect to voice server
    voiceClient.connect();

    this.voiceClients.set(event.channel.id, voiceClient);
    voiceClient.on(SC.ANSWER_REQUEST, this.handleAnswerRequest.bind(this));
    voiceClient.on(SC.PLAY_REQUEST, this.handlePlayRequest.bind(this));
  }

  handleStasisEnd(_: undefined, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.close();
      this.voiceClients.delete(channel.id);
    }
  }

  handleAnswerRequest(answerReq: VerbRequest) {
    const { sessionRef } = answerReq;
    const voiceClient = this.voiceClients.get(sessionRef);

    if (voiceClient) {
      this.ari.channels.answer({ channelId: sessionRef });

      voiceClient.sendResponse({
        answerResponse: {
          sessionRef: answerReq.sessionRef
        }
      });
    }
  }

  async handlePlayRequest(playReq: PlayRequest) {
    const { sessionRef } = playReq;
    const voiceClient = this.voiceClients.get(sessionRef);

    if (voiceClient) {
      const playbackRef = playReq.playbackRef || nanoid(10);
      this.ari.channels.play({
        channelId: sessionRef,
        media: `sound:${playReq.url}`,
        playback: playbackRef
      });

      voiceClient.sendResponse({
        playResponse: {
          sessionRef: playReq.sessionRef,
          playbackRef
        }
      });
    }
  }
}

export { VoiceDispatcher };
