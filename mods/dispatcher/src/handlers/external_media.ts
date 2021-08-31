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
import { getRandomPort, sendData, streamConfig } from "../utils/udp_server_utils";

export const externalMediaHandler = async (
  ws: WebSocket,
  ari: any,
  event: any
) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logger.warn(`@fonos/dispatcher ignoring socket request on lost connection`);
    return;
  }
  // WARNING: We should check if the port was taken
  const address = `0.0.0.0:${getRandomPort()}`;
  const udpServer = new UDPMediaReceiver(address, true);
  const bridge = ari.Bridge();
  const externalChannel = ari.Channel();
  const sessionId = event.userevent.sessionId;

  // Creating a room to receive the audio and then forward 
  // the audio to via ws
  await bridge.create({ type: "mixing" });
  bridge.addChannel({ channel: sessionId });
  externalChannel.on("StasisStart", (event: any, channel: any) =>
    bridge.addChannel({ channel: channel.id })
  );

  // We save the bridge id as channel bar and later use the info
  // to destroy the bridge
  ari.channels.setChannelVar({
    channelId: sessionId,
    variable: "CURRENT_BRIDGE",
    value: bridge.id
  });

  // Collecting and forwarding media
  udpServer.getServer().on("data", (data: Buffer) => sendData(ws, data, sessionId));
  await externalChannel.externalMedia(streamConfig(address));
};

