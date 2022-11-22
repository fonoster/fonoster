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
import { routr } from "@fonoster/core";
import grpc from "@grpc/grpc-js";
import client from "ari-client";
import { CallRequest, CallResponse } from "./protos/callmanager_pb";
import { EndpointInfo } from "../client/types";
import originate from "./call";
import { ICallManagerServer } from "./protos/callmanager_grpc_pb";
import logger from "@fonoster/logger";
import { FonosterError } from "@fonoster/errors";

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
      `@core/callmanager call [ari url ${process.env.MS_ARI_INTERNAL_URL}]`
    );

    logger.verbose(
      `@core/callmanager call [ari username ${process.env.MS_ARI_USERNAME}]`
    );

    logger.verbose(
      `@core/callmanager call [endpoint ${process.env.MS_TRUNK}/${process.env.MS_CONTEXT}/${process.env.MS_EXTENSION}]`
    );

    try {
      const epInfo: EndpointInfo = {
        domain: domainUri,
        trunk: process.env.MS_TRUNK,
        context: process.env.MS_CONTEXT,
        extension: process.env.MS_EXTENSION
      };

      const conn = await client.connect(
        process.env.MS_ARI_INTERNAL_URL,
        process.env.MS_ARI_USERNAME,
        process.env.MS_ARI_SECRET
      );
      const channel = conn.Channel();
      callback(null, await originate(call.request, channel, epInfo));
    } catch (e) {
      callback(e, null);
    }
  }
}

export { CallManagerServer as default, ICallManagerServer, CallManagerServer };
