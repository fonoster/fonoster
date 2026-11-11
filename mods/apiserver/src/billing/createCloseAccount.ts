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
import { createServiceDefinition } from "@fonoster/common";
import * as grpc from "@grpc/grpc-js";

/** How long Identity's DeleteUser waits for billing before refusing (#1376). */
const DEADLINE_MS = 10_000;

/**
 * Billing's CloseAccount for Identity's DeleteUser (Fonoster Cloud, #1376). Internal: the apiserver
 * never serves it. Rejects with `{ code, message }`, the gRPC status and billing's message.
 */
function createCloseAccount(address: string) {
  const client = new (grpc.makeGenericClientConstructor(
    createServiceDefinition({
      serviceName: "Billing",
      pckg: "billing",
      proto: "billing.proto",
      version: "v1beta2"
    }),
    "Billing",
    {}
  ))(address, grpc.credentials.createInsecure()) as unknown as {
    closeAccount(
      request: { ownerRef: string },
      options: grpc.CallOptions,
      callback: grpc.requestCallback<unknown>
    ): void;
  };
  return (ownerRef: string) =>
    new Promise<void>((resolve, reject) =>
      client.closeAccount(
        { ownerRef },
        { deadline: Date.now() + DEADLINE_MS },
        (error) =>
          error
            ? reject({ code: error.code, message: error.details })
            : resolve()
      )
    );
}

export { createCloseAccount };
