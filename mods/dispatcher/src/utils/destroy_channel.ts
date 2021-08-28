import logger from "@fonos/logger";
import {getChannelVar} from "./channel_variable";

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
export async function hangup(
  ari: any,
  sessionId: string,
  destroyBridge = false
) {
  try {
    const channel = await ari.channels.get({channelId: sessionId});
    const bridgeId = await getChannelVar(channel, "CURRENT_BRIDGE");
    logger.verbose(
      `@fonos/dispatcher hangup and destroy bridge [session = ${sessionId}, bridge = ${bridgeId}]`
    );

    if (bridgeId && destroyBridge) {
      await ari.bridges.removeChannel({bridgeId, channel: sessionId});
      await ari.bridges.destroy({bridgeId});
    }

    await channel.destroy();
  } catch (e) {
    /** We can only try because the channel might be already closed */
  }
}

export async function destroyBridge(ari: any, sessionId: string) {
  try {
    const channel = await ari.channels.get({channelId: sessionId});
    const bridgeId = await getChannelVar(channel, "CURRENT_BRIDGE");
    logger.verbose(
      `@fonos/dispatcher remove channel and destroy bridge [session = ${sessionId}, bridge = ${bridgeId}]`
    );

    if (bridgeId) {
      await ari.bridges.removeChannel({bridgeId, channel: sessionId});
      await ari.bridges.destroy({bridgeId});
      return;
    }

    logger.warning(
      `@fonos/dispatcher no bridge found [sessionId = ${sessionId}]`
    );
  } catch (e) {
    /** We can only try because the channel might be already closed */
  }
}
