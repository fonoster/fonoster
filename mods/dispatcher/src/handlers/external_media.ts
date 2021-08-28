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
import WebSocket from "ws";
import UDPMediaReceiver from "../udp_media_receiver";
import logger from "@fonos/logger";
import { destroyBridge } from "../utils/destroy_channel";

const getRandomPort = () =>
  Math.floor(Math.random() * (6000 - 5060)) + 10000;

export const externalMediaHandler = async (
  ws: WebSocket,
  ari: any,
  event: any
) => {
  logger.verbose(
    `@fonos/dispatcher [got user event = ${JSON.stringify(event, null, " ")}]`
  );

  if (ws.readyState !== WebSocket.OPEN) {
    logger.warn(
      `@fonos/dispatcher ignoring socket request on lost connection`
    );
    return;
  }

  const sessionId = event.userevent.sessionId;

  if (event.eventname === "SendExternalMedia") {
    // WARNING: We should check if the port was taken
    const port = getRandomPort();
    const address = `0.0.0.0:${port}`;
    // WARNING: Harcoded value
    const remoteAddress = `172.220.238.54:${port}`;
    const udpServer = new UDPMediaReceiver(address, true);
    const bridge = ari.Bridge();

    const channel = await ari.channels.get({ channelId: sessionId });
    await bridge.create({ type: "mixing" });
    bridge.addChannel({ channel: sessionId });

    ari.channels.setChannelVar({
      channelId: sessionId,
      variable: "CURRENT_BRIDGE",
      value: bridge.id
    });

    const externalChannel = ari.Channel();

    externalChannel.on("StasisStart", (event, chan) => {
      bridge.addChannel({ channel: chan.id });
    });

    udpServer.getServer().on("data", (data: Buffer) => {
      ws.send(Buffer.concat([Buffer.from("" + sessionId.length), Buffer.from(sessionId), data]));
    });

    await externalChannel.externalMedia({
      app: "mediacontroller",
      external_host: remoteAddress,
      format: "slin16"
    });
  } else if (event.eventname === "StopExternalMedia") {
    destroyBridge(ari, sessionId);
  }
};
