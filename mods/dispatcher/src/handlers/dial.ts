/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import WebSocket from "ws";
import logger from "@fonoster/logger";
import { routr } from "@fonoster/core";
import { uploadRecording } from "../utils/upload_recording";
import { getChannelVar } from "../utils/channel_variable";

const getDomainByNumber = async (e164Number: string) => {
  await routr.connect();
  return await routr.getDomainUriFromNumber(e164Number);
};

const numberNotInList = (number) =>
  `the number '${number}' is not assigned to one of your domains. Make sure the number exist and is assigned to a Domain`;

export const dial = async (
  ws: WebSocket,
  ari: any,
  event: any,
  accessKeyId: string
) => {
  const { number, destination, timeout, record, sessionId } = event.userevent;

  logger.silly("initiating dial request", { request: event.userevent });

  if (ws.readyState !== WebSocket.OPEN) {
    logger.warn("ignoring socket request on lost connection");
    return;
  }

  // Which Domain has this number assigned to for outbound
  const domain = await getDomainByNumber(number);

  if (!domain) {
    ws.send(
      JSON.stringify({
        type: "DialFailed",
        sessionId,
        error: numberNotInList(number)
      })
    );
    return;
  }

  const domainUri = domain.spec.context.domainUri;
  const channel = await ari.channels.get({ channelId: sessionId });
  const bridgeId = await getChannelVar(channel, "CURRENT_BRIDGE");
  let bridge = await ari.bridges.get({ bridgeId: bridgeId });

  logger.verbose("dialing sip endpoint", {
    endpoint: `sip:${destination}@${domainUri}`,
    sessionId,
    bridgeId
  });

  if (!bridge) {
    bridge = await ari.bridges.create({
      type: "mixing"
    });
  }

  const dialed = ari.Channel();

  await dialed.originate({
    app: "mediacontroller",
    endpoint: `PJSIP/routr/sip:${destination}@${domainUri}`,
    timeout
  });

  dialed.on("StasisStart", async (event: any, channel: any) => {
    try {
      if (bridgeId) {
        await bridge.addChannel({ channel: dialed.id });
      } else {
        // Is a new bridge so we need to add both channels
        await bridge.addChannel({ channel: [sessionId, dialed.id] });
      }

      if (record) {
        if (record.direction === "in" || record.direction === "both") {
          const channel = await ari.channels.snoopChannel({
            app: "mediacontroller",
            channelId: sessionId,
            spy: "in"
          });
          await ari.channels.record({
            channelId: channel.id,
            format: "wav",
            name: `${sessionId}_in`,
            ifExists: "overwrite"
          });
        }

        if (record.direction === "out" || record.direction === "both") {
          const channel = await ari.channels.snoopChannel({
            app: "mediacontroller",
            channelId: dialed.id,
            spy: "in"
          });
          await ari.channels.record({
            channelId: channel.id,
            format: "wav",
            name: `${sessionId}_out`,
            ifExists: "overwrite"
          });
        }
      }
    } catch (e) {
      logger.warn(e);
      // It is possible that the originating side was already closed
      await dialed.hangup();
    }
  });

  dialed.on("ChannelLeftBridge", async (event: any, resources: any) => {
    logger.verbose("dialed channel left bridge", {
      bridgeId: resources.bridge.id,
      sessionId: resources.channel.id
    });

    try {
      dialed.hangup();
    } catch (e) {
      /** We can only try */
    }

    try {
      await resources.bridge.destroy();
    } catch (e) {
      /* Ignore because the bridge might not exist anymore */
    }
  });

  dialed.on("StasisEnd", async (event: any, channel: any) => {
    if (record) {
      if (record.direction === "in" || record.direction === "both") {
        await uploadRecording(accessKeyId, `${sessionId}_in.wav`);
      }

      if (record.direction === "out" || record.direction === "both") {
        await uploadRecording(accessKeyId, `${sessionId}_out.wav`);
      }
    }
  });

  // TODO: Make all the values into variables
  dialed.on("Dial", async (event: any, channel: any) => {
    let status = event.dialstatus.toLowerCase();
    if (
      !["cancel", "answer", "busy", "progress", "noanswer"].includes(status)
    ) {
      return;
    } else if (status === "chanunavail" || status === "congestion") {
      status = "failed";
    }

    ws.send(
      JSON.stringify({
        type: "DialStatusChanged",
        sessionId,
        data: {
          status
        }
      })
    );
  });

  ws.send(
    JSON.stringify({
      type: "DialStatusChanged",
      sessionId,
      data: {
        status: "trying",
        destination
      }
    })
  );
};
