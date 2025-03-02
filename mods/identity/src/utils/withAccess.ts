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
import { GrpcErrorMessage } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";
import { ServerInterceptingCall } from "@grpc/grpc-js";
import { JsonObject } from "@prisma/client/runtime/library";
import { hasAccessToResource } from "./hasAccessToResource";

function withAccess<T, A>(
  handler: (call: T) => Promise<A>,
  getFn: (ref: string) => Promise<{ extended?: JsonObject }>
) {
  return async (
    call: T,
    callback: (error?: GrpcErrorMessage, response?: A) => void
  ) => {
    const typedCall = call as unknown as ServerInterceptingCall;
    const hasAccess = await hasAccessToResource(typedCall, getFn);

    if (!hasAccess) {
      callback({
        code: grpc.status.PERMISSION_DENIED,
        message: "You don't have permission to access this resource"
      });
      return;
    }

    const response = await handler(call);

    callback(null, response);
  };
}

export { withAccess };
