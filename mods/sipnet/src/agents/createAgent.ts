/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { getAccessKeyIdFromToken, getTokenFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { AgentsAPI, CreateAgentRequest } from "./client";
import { withAccess } from "../withAccess";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function createAgent(agents: AgentsAPI) {
  return withAccess(async (call: { request: CreateAgentRequest }) => {
    const {
      name,
      username,
      privacy,
      domainRef,
      enabled,
      maxContacts,
      expires
    } = call.request;

    const token = getTokenFromCall(
      call as unknown as grpc.ServerInterceptingCall
    );

    const accessKeyId = getAccessKeyIdFromToken(token);

    logger.verbose("call to createAgent", { domainRef });

    return await agents.createAgent({
      name,
      username,
      privacy,
      domainRef,
      enabled,
      maxContacts,
      expires,
      extended: {
        accessKeyId
      }
    });
  }, agents.getAgent);
}

export { createAgent };
