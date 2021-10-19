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
import {destroyBridge, hangup} from "./utils/destroy_channel";
import {channelTalkingHandler} from "./handlers/channel_talking";
import WebSocket from "ws";
import {sendDtmf} from "./handlers/send_dtmf";
import {answer} from "./utils/answer_channel";
import {dial} from "./handlers/dial";
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
      metadata: metadata || {}
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
      sendCallRequest(webhook, request);
    });

    ws.on("error", async (e: Error) => {
      logger.error(
        `@fonos/dispatcher cannot connect with voiceapp [webhook = ${webhook}]`
      );
      logger.silly(e);
      channel.hangup();
    });

    channel.on("ChannelTalkingStarted", async (event: any, channel: any) => {
      channelTalkingHandler(wsConnections.get(channel.id), channel.id, true);
    });

    channel.on("ChannelTalkingFinished", async (event: any, channel: any) => {
      channelTalkingHandler(wsConnections.get(channel.id), channel.id, false);
    });
  });

  ari.on("ChannelUserevent", async (event: any) => {
    logger.verbose(
      `@fonos/dispatcher [got user event = ${JSON.stringify(event, null, " ")}]`
    );
    const wsClient = wsConnections.get(event.userevent.sessionId);

    switch (event.eventname) {
      case "SendExternalMedia":
        await externalMediaHandler(wsClient, ari, event);
        break;
      case "StopExternalMedia":
        await destroyBridge(ari, event.userevent.sessionId);
        break;
      case "UploadRecording":
        await uploadRecording(
          event.userevent.accessKeyId,
          event.userevent.filename
        );
        break;
      case "SendDtmf":
        await sendDtmf(wsClient, ari, event);
        break;
      case "Hangup":
        await hangup(wsClient, ari, event.userevent.sessionId, true);
        break;
      case "Answer":
        await answer(wsClient, ari, event.userevent.sessionId);
        break;
      case "Dial":
        await dial(wsClient, ari, event, event.userevent.accessKeyId);
        break;
      default:
        logger.error(
          `@fonos/dispatcher unknown user ever [name = ${event.eventname}]`
        );
    }
  });

  ari.on("ChannelDtmfReceived", async (event: any, channel: any) => {
    dtmfReceivedHandler(wsConnections.get(channel.id), event, channel);
  });

  ari.on("PlaybackFinished", async (event: any, playback: any) => {
    playbackFinishedHandler(
      wsConnections.get(event.playback.target_uri.split(":")[1]),
      playback
    );
  });

  ari.on("RecordingFinished", (event: any) => {
    const conn = wsConnections.get(event.recording.name)
    // Connection could be null if recording a dialed channel
    conn && recordFinishHandler(conn, event);
  });

  ari.on("RecordingFailed", (event: any) => {
    recordFailedHandler(
      wsConnections.get(event.recording.target_uri.split(":")[1]),
      event
    );
  });

  ari.on("StasisEnd", (event: any, channel: any) => {
    logger.verbose(`@fonos/dispatcher stasis end [sessionId = ${channel.id}]`);
    wsConnections.delete(channel.id);
  });

  ari.start("mediacontroller");
}
