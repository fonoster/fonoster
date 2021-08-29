/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonos
 *
 * This file is part of Project Fonos
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
import Auth from "@fonos/auth";
import Numbers from "@fonos/numbers";
import logger from "@fonos/logger";
import {CallRequest} from "./types";
import {sendCallRequest} from "./utils/send_call_request";
import {getChannelVar, getChannelVarAsJson} from "./utils/channel_variable";
import {externalMediaHandler} from "./handlers/external_media";
import {dtmfReceivedHandler} from "./handlers/dtmf_received";
import {playbackFinishedHandler} from "./handlers/playback_finished";
import {recordFinishHandler} from "./handlers/record_finished";
import {uploadRecording} from "./utils/upload_recording";
import {recordFailedHandler} from "./handlers/record_failed";
import WebSocket from "ws";
import {hangup} from "./utils/destroy_channel";
import { channelTalkingHandler } from "./handlers/channel_talking";

const wsConnections = new Map();

// First try the short env but fallback to the cannonical version
const dialbackEnpoint =
  process.env.ARI_EXTERNAL_URL ||
  process.env.MS_ARI_EXTERNAL_URL ||
  "http://localhost:8088";

export default function (err: any, ari: any) {
  if (err) throw err;

  ari.on("StasisStart", async (event: any, channel: any) => {
    const didInfo = await getChannelVar(channel, "DID_INFO");

    if (!didInfo) {
      // If DID_INFO is not set we need to ignore the event
      logger.silly(
        `@fonos/dispatcher DID_INFO variable not found [ignoring event]`
      );
      return;
    }

    const auth = new Auth();
    const numbers = new Numbers();
    // Renaming variable to keep consistency across the module
    const sessionId = event.channel.id;
    const ingressInfo = await numbers.getIngressInfo({
      e164Number: didInfo
    });

    logger.verbose(`ingressInfo: ${JSON.stringify(ingressInfo, null, " ")}`);

    const webhook =
      (await getChannelVar(channel, "WEBHOOK")) || ingressInfo.webhook;
    const metadata = await getChannelVarAsJson(channel, "METADATA");

    logger.verbose(
      `@fonos/dispatcher stasis start [
      \r sessionId   = ${channel.id}
      \r e164Number  = ${didInfo}
      \r webhook     = ${webhook}
      \r accessKeyId = ${ingressInfo.accessKeyId}
      \r]`
    );

    const access = await auth.createNoAccessToken({
      accessKeyId: ingressInfo.accessKeyId
    });

    const request: CallRequest = {
      accessKeyId: ingressInfo.accessKeyId,
      sessionToken: access.token,
      // Dialback request must travel thru the reverse proxy first
      dialbackEnpoint,
      sessionId,
      number: didInfo,
      callerId: event.channel.caller.name,
      callerNumber: event.channel.caller.number,
      selfEndpoint: webhook,
      metadata: metadata
    };

    logger.verbose(
      `@fonos/dispatcher sending request to mediacontroller [request = ${JSON.stringify(
        request,
        null,
        " "
      )}]`
    );

    const ws = wsConnections.get(sessionId) || new WebSocket(webhook);

    ws.on("open", async () => {
      wsConnections.set(sessionId, ws);
      await sendCallRequest(webhook, request);
    });

    ws.on("error", async (e: Error) => {
      logger.error(
        `@fonos/dispatcher cannot connect with voiceapp [webhook = ${webhook}]`
      );
      logger.silly(e);
      await channel.hangup();
    });  

    channel.on("ChannelTalkingStarted", async (event: any, channel: any) => {
      const wsClient = wsConnections.get(channel.id);
      if (!wsClient) {
        logger.verbose(
          `@fonos/dispatcher ws client not found [session ${channel.id}]`
        );
        return;
      }
      channelTalkingHandler(wsClient, channel.id, true);
    })
  
    channel.on("ChannelTalkingFinished", async (event: any, channel: any) => {
      const wsClient = wsConnections.get(channel.id);
      if (!wsClient) {
        logger.verbose(
          `@fonos/dispatcher ws client not found [session ${channel.id}]`
        );
        return;
      }
      channelTalkingHandler(wsClient, channel.id, false);
    })
  });

  ari.on("StasisEnd", (event, channel) => {
    logger.verbose(`@fonos/dispatcher stasis end [sessionId = ${channel.id}]`);
  });

  ari.on("ChannelUserevent", async (event: any) => {
    const wsClient = wsConnections.get(event.userevent.sessionId);
    if (!wsClient) {
      logger.verbose(
        `@fonos/dispatcher ws client not found [session ${event.userevent.sessionId}]`
      );
      return;
    }
    if (
      event.eventname === "SendExternalMedia" ||
      event.eventname === "StopExternalMedia"
    ) {
      await externalMediaHandler(wsClient, ari, event);
    } else if (event.eventname === "UploadRecording") {
      await uploadRecording(
        event.userevent.accessKeyId,
        event.userevent.filename
      );
    } else if (event.eventname === "Hangup") {
      await hangup(ari, event.userevent.sessionId, false);
    } else {
      logger.error(
        `@fonos/dispatcher unknown user ever [name = ${event.eventname}]`
      );
    }
  });

  ari.on("ChannelDtmfReceived", async (event: any, channel: any) => {
    const wsClient = wsConnections.get(channel.id);
    if (!wsClient) {
      logger.verbose(
        `@fonos/dispatcher ws client not found [session ${channel.id}]`
      );
      return;
    }
    dtmfReceivedHandler(wsClient, event, channel);
  });

  ari.on("PlaybackFinished", async (event: any, playback: any) => {
    // WARNING: Here we are using an undocumented property which could
    // disapear in future Asterisk's version.
    const sessionId = event.playback.target_uri.split(":")[1];
    const wsClient = wsConnections.get(sessionId);
    if (!wsClient) {
      logger.verbose(
        `@fonos/dispatcher ws client not found [session ${sessionId}]`
      );
      return;
    }
    playbackFinishedHandler(wsClient, event, playback);
  });

  ari.on("RecordingFinished", (event: any) => {
    const sessionId = event.recording.target_uri.split(":")[1];
    const wsClient = wsConnections.get(sessionId);
    if (!wsClient) {
      logger.verbose(
        `@fonos/dispatcher ws client not found [session ${sessionId}]`
      );
      return;
    }
    recordFinishHandler(wsClient, event);
  });

  ari.on("RecordingFailed", (event: any) => {
    const sessionId = event.recording.target_uri.split(":")[1];
    const wsClient = wsConnections.get(sessionId);
    if (!wsClient) {
      logger.verbose(
        `@fonos/dispatcher ws client not found [session ${sessionId}]`
      );
      return;
    }
    recordFailedHandler(wsClient, event);
  });

  ari.start("mediacontroller");
}
