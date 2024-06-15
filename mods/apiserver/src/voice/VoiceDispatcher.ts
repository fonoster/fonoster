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
import { StreamContent as SC, STASIS_APP_NAME } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Channel, Client, StasisStart } from "ari-client";
import { answerHandler } from "./handlers/Answer";
import { dialHandler } from "./handlers/dial/Dial";
import { gatherHandler } from "./handlers/Gather";
import { hangupHandler } from "./handlers/Hangup";
import { muteHandler } from "./handlers/Mute";
import { playHandler } from "./handlers/Play";
import { playbackControlHandler } from "./handlers/PlaybackControl";
import { playDtmfHandler } from "./handlers/PlayDtmf";
import { sayHandler } from "./handlers/Say";
import { unmuteHandler } from "./handlers/Unmute";
import { AriEvent, VoiceClient } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CreateVoiceClient = (params: {
  ari: Client;
  event: StasisStart;
  channel: Channel;
}) => Promise<VoiceClient>;

class VoiceDispatcher {
  voiceClients: Map<string, VoiceClient>;
  ari: Client;
  createVoiceClient: CreateVoiceClient;

  constructor(ari: Client, createVoiceClient: CreateVoiceClient) {
    this.ari = ari;
    this.voiceClients = new Map();
    this.createVoiceClient = createVoiceClient;
  }

  start() {
    // Initialize the ARI client
    this.ari.start(STASIS_APP_NAME);
    this.ari.on(AriEvent.STASIS_START, this.handleStasisStart.bind(this));
    this.ari.on(AriEvent.STASIS_END, this.handleStasisEnd.bind(this));
  }

  async handleStasisStart(event: StasisStart, channel: Channel) {
    // TODO: This is a temporary fix. We need to find a better way to handle external media channels
    if (channel.id.length > 15) {
      logger.verbose("skipping statis start for external media channel", {
        channel: channel.id
      });
      return;
    }
    const vc = await this.createVoiceClient({ ari: this.ari, event, channel });

    // Connect to voice server
    vc.connect();

    this.voiceClients.set(channel.id, vc);

    vc.on(SC.ANSWER_REQUEST, answerHandler(this.ari, vc).bind(this));
    vc.on(SC.HANGUP_REQUEST, hangupHandler(this.ari, vc).bind(this));
    vc.on(SC.MUTE_REQUEST, muteHandler(this.ari, vc).bind(this));
    vc.on(SC.UNMUTE_REQUEST, unmuteHandler(this.ari, vc).bind(this));
    vc.on(SC.PLAY_REQUEST, playHandler(this.ari, vc).bind(this));
    vc.on(SC.PLAY_DTMF_REQUEST, playDtmfHandler(this.ari, vc).bind(this));
    vc.on(
      SC.PLAYBACK_CONTROL_REQUEST,
      playbackControlHandler(this.ari, vc).bind(this)
    );
    vc.on(SC.SAY_REQUEST, sayHandler(this.ari, vc).bind(this));
    vc.on(SC.GATHER_REQUEST, gatherHandler(this.ari, vc).bind(this));
    vc.on(SC.DIAL_REQUEST, dialHandler(this.ari, vc).bind(this));
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
