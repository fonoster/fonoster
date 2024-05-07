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
import { GRPCErrors, handleError } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { DomainsAPI, ListDomainsResponse } from "./client";
import { ListDomainsRequest } from "./types";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function listDomains(domains: DomainsAPI) {
  return async (
    call: { request: ListDomainsRequest },
    callback: (error: GRPCErrors, response?: ListDomainsResponse) => void
  ) => {
    try {
      const { request } = call;

      // FIXME: Should check the ownership of the domain
      // const token = getTokenFromCall(
      //   call as unknown as grpc.ServerInterceptingCall
      // );
      // const accessKeyId = getAccessKeyIdFromToken(token);

      logger.verbose("call to listDomains", { request });

      const response = await domains.listDomains(request);

      callback(null, response);
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { listDomains };
