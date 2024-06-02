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
import { StreamContent as SC } from "@fonoster/common";
import { answerHandler } from "./handlers/Answer";
import { hangupHandler } from "./handlers/Hangup";
import { muteHandler } from "./handlers/Mute";
import { playHandler } from "./handlers/Play";
import { playbackControlHandler } from "./handlers/PlaybackControl";
import { playDtmfHandler } from "./handlers/PlayDtmf";
import { unmuteHandler } from "./handlers/Unmute";
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
  }

  async handleStasisStart(event: StasisStartEvent, channel: Channel) {
    const vc = await this.createVoiceClient(event, channel);

    // Connect to voice server
    vc.connect();

    this.voiceClients.set(channel.id, vc);

    vc.on(SC.ANSWER_REQUEST, answerHandler(this.ari, vc).bind(this));
    vc.on(SC.HANGUP_REQUEST, hangupHandler(this.ari, vc).bind(this));
    vc.on(SC.PLAY_REQUEST, playHandler(this.ari, vc).bind(this));
    vc.on(SC.MUTE_REQUEST, muteHandler(this.ari, vc).bind(this));
    vc.on(SC.UNMUTE_REQUEST, unmuteHandler(this.ari, vc).bind(this));
    vc.on(SC.PLAY_DTMF_REQUEST, playDtmfHandler(this.ari, vc).bind(this));
    vc.on(
      SC.PLAYBACK_CONTROL_REQUEST,
      playbackControlHandler(this.ari, vc).bind(this)
    );
  }

  handleStasisEnd(_: undefined, channel: Channel) {
    const voiceClient = this.voiceClients.get(channel.id);
    if (voiceClient) {
      voiceClient.close();
      this.voiceClients.delete(channel.id);
    }
  }
}

export { VoiceDispatcher };
