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
import logger from "@fonos/logger";
import {routr} from "@fonos/core";

const getDomainByNumber = async (e164Number: string) => {
  await routr.connect();
  return await routr.getDomainUriFromNumber(e164Number);
};

const numberNotInList = (number) =>
  `the number '${number}' is not assigned to one of your domains. Make sure the number exist and is assigned to a Domain`;

export const transfer = async (ws: WebSocket, ari: any, event: any) => {
  logger.verbose(
    `@fonos/dispatcher transfering call [sessionId: ${event.userevent.sessionId}, number: ${event.userevent.number}]`
  );

  if (ws.readyState !== WebSocket.OPEN) {
    logger.warn(`@fonos/dispatcher ignoring socket request on lost connection`);
    return;
  }

  // Which Domain has this number assigned to for outbound
  const domain = await getDomainByNumber(event.userevent.number);
  const domainUri = domain.spec.context.domainUri;

  if (!domain) {
    ws.send(
      JSON.stringify({
        type: "CallTransferFailed",
        sessionId: event.userevent.sessionId,
        error: numberNotInList(event.userevent.number)
      })
    );
    return;
  }

  logger.verbose(
    `@fonos/dispatcher dialing [sip:${event.userevent.destination}@${domainUri}]`
  );

  const transferBridge = await ari.bridges.create({
    type: "mixing"
  });

  const dialed = ari.Channel();

  // TODO: Get the domain from the number
  // WARNING: Harcoded values
  await dialed.originate({
    app: "mediacontroller",
    endpoint: `PJSIP/routr/sip:${event.userevent.destination}@${domainUri}`,
    variables: {
      SESSION_ID: event.userevent.sessionId,
      DIALED_CHANNEL_ID: dialed.id,
      TRANSFER_BRIDGE_ID: transferBridge.id
    },
    timeout: event.userevent.timeout
  });

  ws.send(
    JSON.stringify({
      type: "CallTransfering",
      sessionId: event.userevent.sessionId
    })
  );
};
