/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import { CallRequest } from "./types";
import { sendCallRequest } from "./utils/send_call_request";
import { getChannelVar, getChannelVarAsJson } from "./utils/channel_variable";
import { externalMediaHandler } from "./handlers/external_media";
import { dtmfReceivedHandler } from "./handlers/dtmf_received";
import { playbackFinishedHandler } from "./handlers/playback_finished";
import { recordFinishHandler } from "./handlers/record_finished";
import { uploadRecording } from "./utils/upload_recording";
import { recordFailedHandler } from "./handlers/record_failed";
import { hangup, hangupExternalChannel } from "./utils/destroy_channel";
import { channelTalkingHandler } from "./handlers/channel_talking";
import { sendDtmf } from "./handlers/send_dtmf";
import { answer } from "./utils/answer_channel";
import { dial } from "./handlers/dial";
import { ulogger, ULogType, getLogger } from "@fonoster/logger";
import { ARI_PROXY_URL } from "./envs";
import Auth from "@fonoster/auth";
import Numbers from "@fonoster/numbers";
import WebSocket from "ws";

const wsConnections = new Map();
const logger = getLogger({ service: "dispatcher", filePath: __filename });

export default function (err: any, ari: any) {
  if (err) throw err;

  ari.on("StasisStart", async (event: any, channel: any) => {
    const didInfo = await getChannelVar(channel, "DID_INFO");

    if (!didInfo) {
      // If DID_INFO is not set we need to ignore the event
      logger.silly("variable DID_INFO not found [ignoring event]");
      return;
    }

    const auth = new Auth();
    const numbers = new Numbers();
    // Renaming variable to keep consistency across the module
    const sessionId = event.channel.id;
    const ingressInfo = await numbers.getIngressInfo({
      e164Number: didInfo
    });

    const appRef =
      (await getChannelVar(channel, "APP_REF")) || ingressInfo.appRef;
    const webhook =
      (await getChannelVar(channel, "WEBHOOK")) || ingressInfo.webhook;
    const metadata = await getChannelVarAsJson(channel, "METADATA");

    logger.silly("new request ingressed to dispatcher", ingressInfo);
    logger.silly("dispatcher found related metadata for request", {
      sessionId: channel.id,
      e164Number: didInfo,
      webhook: webhook,
      accessKeyId: ingressInfo.accessKeyId
    });

    const access = await auth.createToken({
      accessKeyId: ingressInfo.accessKeyId,
      roleName: "PROJECT",
      expiration: "5m"
    });

    const request: CallRequest = {
      accessKeyId: ingressInfo.accessKeyId,
      sessionToken: access.token,
      // Dialback request must travel thru the reverse proxy first
      dialbackEnpoint: ARI_PROXY_URL,
      sessionId,
      number: didInfo,
      callerId: event.channel.caller.name,
      callerNumber: event.channel.caller.number,
      selfEndpoint: webhook,
      appRef,
      metadata: metadata || {}
    };

    logger.silly("dispatcher sending request to dialback", request);

    const ws = wsConnections.get(sessionId) || new WebSocket(webhook);

    ws.on("open", async () => {
      wsConnections.set(sessionId, ws);
      sendCallRequest(webhook, request);
    });

    ws.on("error", async (e: Error) => {
      const message =
        "error connecting with your webhook. please ensure your webhook is valid and accessible";
      logger.error(message, { webhook });
      ulogger({
        accessKeyId: request.accessKeyId,
        eventType: ULogType.APP,
        level: "error",
        message: message,
        body: { webhook }
      });
      channel.hangup();
      wsConnections.delete(sessionId);
    });

    channel.on("ChannelTalkingStarted", async (event: any, channel: any) => {
      const sessionId = channel.id;
      const wsClient = wsConnections.get(sessionId);

      if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        logger.warn("ignoring socket request on lost connection", {
          sessionId
        });
        wsConnections.delete(sessionId);
        return;
      }

      channelTalkingHandler(wsClient, sessionId, true);
    });

    channel.on("ChannelTalkingFinished", async (event: any, channel: any) => {
      const sessionId = channel.id;
      const wsClient = wsConnections.get(sessionId);

      if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
        logger.warn("ignoring socket request on lost connection", {
          sessionId
        });
        wsConnections.delete(sessionId);
        return;
      }

      channelTalkingHandler(wsClient, sessionId, false);
    });

    channel.on("ChannelLeftBridge", async (event: any, resources: any) => {
      logger.verbose("channel left bridge", {
        bridgeId: resources.bridge.id,
        channelId: resources.channel.id
      });
      try {
        await channel.hangup();
      } catch (e) {
        /* Ignore because because channel might not exist anymore */
      }
      try {
        await resources.bridge.destroy();
      } catch (e) {
        /* Ignore because the bridge might not exist anymore */
      }
    });
  });

  // WARNING: The typo in the event name is intentional
  ari.on("ChannelUserevent", async (event: any) => {
    logger.verbose("dispatcher received user event", { event });

    const sessionId = event.userevent.sessionId;
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      wsConnections.delete(sessionId);
      return;
    }

    switch (event.eventname) {
      case "SendExternalMedia":
        await externalMediaHandler(wsClient, ari, event);
        break;
      case "StopExternalMedia":
        await hangupExternalChannel(ari, event.userevent.sessionId);
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
        await hangup(ari, event.userevent.sessionId);
        break;
      case "Answer":
        await answer(wsClient, ari, event.userevent.sessionId);
        break;
      case "Dial":
        await dial(wsClient, ari, event, event.userevent.accessKeyId);
        break;
      default:
        logger.error("unknown user event", { event: event.eventname });
    }
  });

  ari.on("ChannelDtmfReceived", async (event: any, channel: any) => {
    const sessionId = channel.id;
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      wsConnections.delete(sessionId);
      return;
    }

    dtmfReceivedHandler(wsClient, event, channel);
  });

  ari.on("PlaybackFinished", async (event: any, playback: any) => {
    const sessionId = event.playback.target_uri.split(":")[1];
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      wsConnections.delete(sessionId);
      return;
    }

    playbackFinishedHandler(wsClient, playback);
  });

  ari.on("RecordingFinished", (event: any) => {
    const sessionId = event.recording.name;
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      return;
    }

    recordFinishHandler(wsClient, event);
  });

  ari.on("RecordingFailed", (event: any) => {
    const sessionId = event.recording.target_uri.split(":")[1];
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      wsConnections.delete(sessionId);
      return;
    }

    recordFailedHandler(wsClient, event);
  });

  ari.on("StasisEnd", async (event: any, channel: any) => {
    logger.verbose("voice session ended", { sessionId: channel.id });
    const sessionId = channel.id;
    const wsClient = wsConnections.get(sessionId);

    if (!wsClient || wsClient.readyState !== WebSocket.OPEN) {
      logger.warn("ignoring socket request on lost connection", { sessionId });
      wsConnections.delete(sessionId);
      return;
    }

    if (wsClient) {
      wsClient.send(
        JSON.stringify({
          type: "SessionClosed",
          sessionId: sessionId
        })
      );
      wsConnections.delete(sessionId);
    }
  });

  ari.start("mediacontroller");
}
