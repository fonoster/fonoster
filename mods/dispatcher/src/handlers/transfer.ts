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
import {uploadRecording} from "../utils/upload_recording";

const getDomainByNumber = async (e164Number: string) => {
  await routr.connect();
  return await routr.getDomainUriFromNumber(e164Number);
};

const numberNotInList = (number) =>
  `the number '${number}' is not assigned to one of your domains. Make sure the number exist and is assigned to a Domain`;

export const transfer = async (ws: WebSocket, ari: any, event: any, accessKeyId: string) => {
  const {
    number, 
    destination, 
    timeout,
    record,
    sessionId
  } = event.userevent

  logger.verbose(
    `@fonos/dispatcher transfering call [request: ${JSON.stringify(event.userevent, null, ' ')}`
  );

  if (ws.readyState !== WebSocket.OPEN) {
    logger.warn(`@fonos/dispatcher ignoring socket request on lost connection`);
    return;
  }

  // Which Domain has this number assigned to for outbound
  const domain = await getDomainByNumber(number);
  const domainUri = domain.spec.context.domainUri;

  if (!domain) {
    ws.send(
      JSON.stringify({
        type: "CallTransferFailed",
        sessionId,
        error: numberNotInList(number)
      })
    );
    return;
  }

  logger.verbose(
    `@fonos/dispatcher dialing [endpoint = sip:${destination}@${domainUri}]`
  );

  const bridge = await ari.bridges.create({
    type: "mixing"
  });

  const dialed = ari.Channel();

  // TODO: Get the domain from the number
  // WARNING: Harcoded values
  await dialed.originate({
    app: "mediacontroller",
    endpoint: `PJSIP/routr/sip:${destination}@${domainUri}`,
    timeout
  });

  dialed.on("StasisStart", async (event: any, channel: any) => {
    try {
      await bridge.addChannel({channel: [sessionId, dialed.id]})
      if (record) {
        // The name of the recordings is allways set to the sessionId
        // We can later use this to map a CDR to a particular recording
        await bridge.record({
          name: sessionId,
          format: "wav",
          ifExists: "append"
        })
      }
    } catch(e) {
      logger.warn(e)
      // It is possible that the originating side was already closed
      await dialed.hangup()
    }
  });

  dialed.on("StasisEnd", async (event: any, channel: any) => {
    const bridgeId = bridge.id
    try {
      await ari.bridges.removeChannel({bridgeId, channel: sessionId});
      const channel = await ari.channels.get({channelId: sessionId});
      await channel.hangup();
    } catch(e) {
      /** We can only try because the originating channel might be already closed */
      logger.warn(e)
    } finally {
      if (record) {
        await uploadRecording(accessKeyId, sessionId)
      }      
      await ari.bridges.destroy({bridgeId});
    }
  });

  ws.send(
    JSON.stringify({
      type: "CallTransfering",
      sessionId
    })
  );
};
