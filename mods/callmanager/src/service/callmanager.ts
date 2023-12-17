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
import * as grpc from "@grpc/grpc-js";
import { routr } from "@fonoster/core";
import { CallRequest, CallResponse } from "./protos/callmanager_pb";
import { EndpointInfo } from "../client/types";
import { FonosterError } from "@fonoster/errors";
import {
  CallManagerService,
  ICallManagerServer
} from "./protos/callmanager_grpc_pb";
import {
  APISERVER_ASTERISK_ARI_INTERNAL_URL,
  APISERVER_ASTERISK_ARI_USERNAME,
  APISERVER_ASTERISK_TRUNK,
  APISERVER_ASTERISK_CONTEXT,
  APISERVER_ASTERISK_EXTENSION,
  APISERVER_ASTERISK_ARI_SECRET
} from "./envs";
import originate from "./call";
import client from "ari-client";
import logger from "@fonoster/logger";

const getDomainByNumber = async (e164Number: string) => {
  await routr.connect();
  return await routr.getDomainUriFromNumber(e164Number);
};

const numberNotInList = (number) =>
  `the number '${number}' is not assigned to one of your domains. Make sure the number exist and is assigned to a Domain`;

class CallManagerServer implements ICallManagerServer {
  [name: string]: grpc.UntypedHandleCall;
  async call(
    call: grpc.ServerUnaryCall<CallRequest, CallResponse>,
    callback: grpc.sendUnaryData<CallResponse>
  ) {
    logger.verbose(`@core/callmanager call [from ${call.request.getFrom()}]`);

    const domain = await getDomainByNumber(call.request.getFrom());

    if (!domain) {
      callback(
        new FonosterError(numberNotInList(call.request.getFrom())),
        null
      );
      return;
    }

    logger.verbose(`@core/callmanager call [domain ${JSON.stringify(domain)}]`);

    const domainUri: string = domain.spec.context.domainUri;
    const accessKeyId = call.metadata.get("access_key_id")[0];
    const accessKeyIdDomain = domain.metadata.accessKeyId;

    if (accessKeyIdDomain != accessKeyId) {
      callback(
        new FonosterError(numberNotInList(call.request.getFrom())),
        null
      );
    }

    logger.verbose(
      `@core/callmanager call [ari url ${APISERVER_ASTERISK_ARI_INTERNAL_URL}]`
    );

    logger.verbose(
      `@core/callmanager call [ari username ${APISERVER_ASTERISK_ARI_USERNAME}]`
    );

    logger.verbose(
      `@core/callmanager call [endpoint ${APISERVER_ASTERISK_TRUNK}/${APISERVER_ASTERISK_CONTEXT}/${APISERVER_ASTERISK_EXTENSION}]`
    );

    try {
      const epInfo: EndpointInfo = {
        domain: domainUri,
        trunk: APISERVER_ASTERISK_TRUNK,
        context: APISERVER_ASTERISK_CONTEXT,
        extension: APISERVER_ASTERISK_EXTENSION
      };

      const conn = await client.connect(
        APISERVER_ASTERISK_ARI_INTERNAL_URL,
        APISERVER_ASTERISK_ARI_USERNAME,
        APISERVER_ASTERISK_ARI_SECRET
      );
      const channel = conn.Channel();
      callback(null, await originate(call.request, channel, epInfo));
    } catch (e) {
      callback(e, null);
    }
  }
}

export {
  CallManagerServer as default,
  CallManagerService,
  ICallManagerServer,
  CallManagerServer
};
