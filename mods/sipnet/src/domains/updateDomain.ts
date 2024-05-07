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
import { getAccessKeyIdFromToken, getTokenFromCall } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { DomainsAPI } from "./client";
import { UpdateDomainRequest, UpdateDomainResponse } from "./types";

const logger = getLogger({ service: "sipnet", filePath: __filename });

function updateDomain(domains: DomainsAPI) {
  return async (
    call: { request: UpdateDomainRequest },
    callback: (error: GRPCErrors, response?: UpdateDomainResponse) => void
  ) => {
    try {
      const { ref, name, accessControlListRef, egressPolicies } = call.request;

      const token = getTokenFromCall(
        call as unknown as grpc.ServerInterceptingCall
      );

      const accessKeyId = getAccessKeyIdFromToken(token);

      logger.verbose("call to updateDomain", { ref, name });

      const response = await domains.updateDomain({
        ref,
        name,
        accessControlListRef,
        egressPolicies,
        extended: {
          accessKeyId
        }
      });

      callback(null, {
        ref: response.ref
      });
    } catch (error) {
      handleError(error, callback);
    }
  };
}

export { updateDomain };
