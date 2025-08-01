/**
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
import { StreamContent as SC, STASIS_APP_NAME } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Channel, Client, Dial, StasisStart } from "ari-client";
import { NatsConnection } from "nats";
import { createHandleDialEventsWithNats } from "../utils";
import {
  createAnswerHandler,
  createDialHandler,
  createGatherHandler,
  createHangupHandler,
  createMuteHandler,
  createPlaybackControlHandler,
  createPlayDtmfHandler,
  createPlayHandler,
  createSayHandler,
  createStopSayHandler,
  createStreamGatherHandler,
  createStreamHandler,
  createUnmuteHandler
} from "./handlers";
import { AriEvent as AE, ChannelVar, VoiceClient } from "./types";
import { createGetChannelVarWithoutThrow } from "./utils";

const logger = getLogger({ service: "apiserver", filePath: __filename });

type CreateVoiceClient = (params: {
  ari: Client;
  event: StasisStart;
  channel: Channel;
}) => Promise<VoiceClient>;

class VoiceDispatcher {
  voiceClients: Map<string, VoiceClient>;
  ari: Client;
  nc: NatsConnection;
  createVoiceClient: CreateVoiceClient;

  constructor(
    ari: Client,
    nc: NatsConnection,
    createVoiceClient: CreateVoiceClient
  ) {
    this.ari = ari;
    this.nc = nc;
    this.voiceClients = new Map();
    this.createVoiceClient = createVoiceClient;
  }

  start() {
    // Initialize the ARI client
    const { ari, handleStasisStart, handleStasisEnd, handleDial } = this;
    ari.start(STASIS_APP_NAME);
    ari.on(AE.STASIS_START, handleStasisStart.bind(this));
    ari.on(AE.STASIS_END, handleStasisEnd.bind(this));
    ari.on(AE.DIAL, handleDial.bind(this));
  }

  async handleStasisStart(event: StasisStart, channel: Channel) {
    const { ari, voiceClients, createVoiceClient, isHandledElsewhere } = this;

    const getChannelVar = createGetChannelVarWithoutThrow(channel);
    const appRef = (await getChannelVar(ChannelVar.APP_REF))?.value;

    // This check feels strange but is necessary as ARI calls this event twice
    if (!appRef) {
      logger.silly("no appRef found, ignoring handleStasisStart event");
      return;
    }

    if (await isHandledElsewhere(channel)) {
      return;
    }

    try {
      const vc = await createVoiceClient({ ari, event, channel });

      // Connect to voice server
      vc.connect();

      voiceClients.set(channel.id, vc);

      vc.on(SC.ANSWER_REQUEST, createAnswerHandler(ari, vc).bind(this));
      vc.on(SC.HANGUP_REQUEST, createHangupHandler(ari, vc).bind(this));
      vc.on(SC.MUTE_REQUEST, createMuteHandler(ari, vc).bind(this));
      vc.on(SC.UNMUTE_REQUEST, createUnmuteHandler(ari, vc).bind(this));
      vc.on(SC.PLAY_REQUEST, createPlayHandler(ari, vc).bind(this));
      vc.on(SC.PLAY_DTMF_REQUEST, createPlayDtmfHandler(ari, vc).bind(this));
      vc.on(SC.SAY_REQUEST, createSayHandler(ari, vc).bind(this));
      vc.on(SC.GATHER_REQUEST, createGatherHandler(vc).bind(this));
      vc.on(SC.DIAL_REQUEST, createDialHandler(ari, vc).bind(this));
      vc.on(SC.STOP_SAY_REQUEST, createStopSayHandler(vc).bind(this));
      vc.on(
        SC.PLAYBACK_CONTROL_REQUEST,
        createPlaybackControlHandler(ari, vc).bind(this)
      );
      vc.on(
        SC.START_STREAM_GATHER_REQUEST,
        createStreamGatherHandler(vc).bind(this)
      );
      vc.on(SC.STOP_STREAM_GATHER_REQUEST, () => {
        vc.stopStreamGather();
      });
      vc.on(SC.START_STREAM_REQUEST, createStreamHandler(vc).bind(this));
    } catch (err) {
      logger.error("error handling stasis start", { error: err.message });
    }
  }

  handleStasisEnd(_: undefined, channel: Channel) {
    const { voiceClients } = this;

    const voiceClient = voiceClients.get(channel.id);

    if (voiceClient) {
      voiceClient.close();
      voiceClients.delete(channel.id);
    }
  }

  async handleDial(event: Dial, channel: Channel) {
    createHandleDialEventsWithNats(this.nc)(channel.id, event);
  }

  async isHandledElsewhere(channel: Channel) {
    return (
      (
        await createGetChannelVarWithoutThrow(channel)(
          ChannelVar.FROM_EXTERNAL_MEDIA
        )
      )?.value === "true"
    );
  }
}

export { VoiceDispatcher };
