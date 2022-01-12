import logger from "@fonoster/logger";
import WebSocket from "ws";
import {getChannelVar} from "./channel_variable";

/*
 * Copyright (C) 2021 by Fonoster Inc (https://fonoster.com)
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
export async function hangup(ari: any, sessionId: string) {
  try {
    const channel = await ari.channels.get({channelId: sessionId});
    const externalChannelId = await getChannelVar(channel, "EXTERNAL_CHANNEL");
    const bridgeId = await getChannelVar(channel, "CURRENT_BRIDGE");
    logger.verbose(
      `@fonoster/dispatcher hangup and destroy bridge [session = ${sessionId}, bridge = ${bridgeId}]`
    );

    if (bridgeId) {
      await ari.bridges.removeChannel({bridgeId, channel: sessionId});
      await ari.bridges.removeChannel({bridgeId, channel: externalChannelId});
      await ari.bridges.destroy({bridgeId});
    }

    channel.hangup();
  } catch (e) {
    /** We can only try because the channel might be already closed */
  }
}

export async function hangupExternalChannel(ari: any, sessionId: string) {
  try {
    const channel = await ari.channels.get({channelId: sessionId});
    const externalChannelId = await getChannelVar(channel, "EXTERNAL_CHANNEL");
    const bridgeId = await getChannelVar(channel, "CURRENT_BRIDGE");
    logger.verbose(
      `@fonoster/dispatcher remove external media channel [session = ${sessionId}, bridge = ${bridgeId}]`
    );

    if (bridgeId && externalChannelId) {
      await ari.bridges.removeChannel({bridgeId, channel: externalChannelId});
      return;
    }

    logger.warning(
      `@fonoster/dispatcher no bridge or external chanel found [sessionId = ${sessionId}]`
    );
  } catch (e) {
    /** We can only try because the channel might be already closed */
  }
}
