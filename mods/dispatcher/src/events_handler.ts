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
import axios from "axios";
import WebSocket from "ws";

// First try the short env but fallback to the cannonical version
const dialbackEnpoint =
  process.env.ARI_EXTERNAL_URL 
  || process.env.MS_ARI_EXTERNAL_URL 
  || "http://localhost:8088";

export default function (err, client) {
  if (err) throw err;

  client.on("StasisStart", async (event, channel) => {
    const auth = new Auth();
    const numbers = new Numbers();
    const sessionId = event.channel.id;

    const didInfo = await channel.getChannelVar({
      channelId: channel.id,
      variable: "DID_INFO"
    });
    const ingressInfo = await numbers.getIngressInfo({
      e164Number: didInfo.value
    });

    logger.debug(`@fonos/dispatcher statis start [channelId = ${channel.id}]`);
    logger.debug(
      `@fonos/dispatcher statis start [e164Number = ${didInfo.value}]`
    );
    logger.debug(
      `@fonos/dispatcher statis start [webhook = ${ingressInfo.webhook}, accessKeyId = ${ingressInfo.accessKeyId}]`
    );

    const access = await auth.createNoAccessToken({
      accessKeyId: ingressInfo.accessKeyId
    });

    const request: CallRequest = {
      accessKeyId: ingressInfo.accessKeyId,
      signature: access.token,
      // Dialback request must travel thru the reverse proxy first
      dialbackEnpoint,
      sessionId,
      number: didInfo.value,
      callerId: event.channel.caller.name,
      callerNumber: event.channel.caller.number
    };

    logger.verbose(
      `@fonos/dispatcher sending request to mediacontroller [request = ${JSON.stringify(
        request
      )}]`
    );

    axios
      .post(ingressInfo.webhook, request)
      .then((response) => {
        logger.verbose(
          `@fonos/dispatcher mediacontroller [response = ${
            response.data ? response.data.data : "no response"
          }]`
        );
      })
      .catch(logger.error);
 
    const ws = new WebSocket(ingressInfo.webhook);
    
    ws.on('open', function open() {
      channel.on("ChannelDtmfReceived", (event, channel) => {
        logger.verbose(`@fonos/dispatcher sending dtmf event [digit: ${event.digit}]`)
        ws.send(JSON.stringify({type: "DtmfReceived", sessionId: channel.id, data: event.digit}))
      });

      client.on("PlaybackFinished", (event, playback) => {
        logger.verbose(`@fonos/dispatcher sending playback finished event [playbackId: ${playback.id}]`)
        ws.send(JSON.stringify({type: "PlaybackFinished", sessionId, data: playback.id}))
      });
    });
  });

  client.on("StasisEnd", (event, channel) => {
    logger.debug(`@fonos/dispatcher statis end [channelId ${channel.id}]`);
  });

  client.start("mediacontroller");
}
