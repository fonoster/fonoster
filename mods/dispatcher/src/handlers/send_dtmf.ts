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
import WebSocket from "ws";
import logger from "@fonoster/logger";

export const sendDtmf = async (ws: WebSocket, ari: any, event: any) => {
  logger.verbose("sending dtmf tones", {
    sessionId: event.userevent.sessionId,
    tones: event.userevent.dtmf
  });

  const channel = await ari.channels.get({
    channelId: event.userevent.sessionId
  });

  await channel.sendDTMF({
    dtmf: event.userevent.dtmf
  });

  ws.send(
    JSON.stringify({
      type: "SendDtmfFinished",
      sessionId: event.userevent.sessionId
    })
  );
};
