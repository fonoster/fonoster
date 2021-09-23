import logger from "@fonos/logger";
import WebSocket from "ws";
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
export async function answer(
  ws: WebSocket,
  ari: any,
  sessionId: string,
) {
  try {
    logger.verbose(
      `@fonos/dispatcher acepting call request [session = ${sessionId}]`
    );

    await ari.channels.answer({channelId: sessionId});

    ws.send(
      JSON.stringify({
        type: "SessionOpen",
        sessionId
      })
    );
  } catch (e) {
    logger.error(e)
  }
}
