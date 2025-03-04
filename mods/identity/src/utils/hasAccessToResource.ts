/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import {
  Access,
  decodeToken,
  getTokenFromCall,
  TokenUseEnum
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { JsonObject } from "@prisma/client/runtime/library";

const logger = getLogger({ service: "sipnet", filePath: __filename });

async function hasAccessToResource(
  call: unknown,
  getFn: (ref: string) => Promise<{ extended?: JsonObject }>
) {
  const { request } = call as { request: { ref: string } };
  const { extended } = await getFn(request.ref);

  logger.verbose("call to hasAccessToResource", {
    ref: request.ref,
    accessKeyId: extended?.accessKeyId
  });

  // If the resource doesn't exist, allow the operation
  if (!extended) return true;

  const token = getTokenFromCall(call as ServerInterceptingCall);
  const decodedToken = decodeToken<TokenUseEnum.ACCESS>(token);
  const accessKeyIds = decodedToken.access?.map((a: Access) => a.accessKeyId);

  return accessKeyIds.includes(extended?.accessKeyId as string);
}

export { hasAccessToResource };
