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
import UDPMediaReceiver from "../udp_media_receiver";
import logger from "@fonoster/logger";
import { sendData, streamConfig } from "../utils/udp_server_utils";
import pickPort from "pick-port";
import { getChannelVar } from "../utils/channel_variable";

export const externalMediaHandler = async (
  ws: WebSocket,
  ari: any,
  event: any
) => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logger.warn("ignoring socket request on lost connection");
    return;
  }
  const port = await pickPort();
  const address = `0.0.0.0:${port}`;
  const udpServer = new UDPMediaReceiver(address, true);
  const sessionId = event.userevent.sessionId;
  const currentChannel = await ari.channels.get({ channelId: sessionId });
  const bridgeId = await getChannelVar(currentChannel, "CURRENT_BRIDGE");
  let bridge: any;

  // We check if the bridge already exist to avoid creating a new one
  if (bridgeId) {
    bridge = await ari.bridges.get({ bridgeId });
  } else {
    bridge = ari.Bridge();
    await bridge.create({ type: "mixing" });
    bridge.addChannel({ channel: sessionId });

    // We save the bridge id as channel bar and later use the info
    // to destroy the bridge
    ari.channels.setChannelVar({
      channelId: sessionId,
      variable: "CURRENT_BRIDGE",
      value: bridge.id
    });
  }

  const externalChannel = ari.Channel();
  externalChannel.on("StasisStart", (event: any, channel: any) =>
    bridge.addChannel({ channel: channel.id })
  );

  externalChannel.on("StasisEnd", () => {
    try {
      udpServer.close();
    } catch (e) {
      console.warn(e);
    }
  });

  externalChannel.on(
    "ChannelLeftBridge",
    async (event: any, resources: any) => {
      logger.verbose("external channel left the bridge", {
        brideId: resources.bridge.id,
        externalChannelId: resources.channel.id
      });
      await externalChannel.hangup();
    }
  );

  // We save the bridge id as channel bar and later use the info
  // to destroy the bridge
  ari.channels.setChannelVar({
    channelId: sessionId,
    variable: "EXTERNAL_CHANNEL",
    value: externalChannel.id
  });

  // Collecting and forwarding media
  udpServer
    .getServer()
    .on("data", (data: Buffer) => sendData(ws, data, sessionId));

  await externalChannel.externalMedia(streamConfig(address));
};
