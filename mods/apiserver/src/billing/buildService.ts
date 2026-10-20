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
  createServiceDefinition,
  decodeToken,
  getAccessKeyIdFromCall,
  getTokenFromCall,
  TokenUseEnum
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";

const logger = getLogger({ service: "apiserver", filePath: __filename });

const METHODS = [
  "getBilling",
  "updateAutoRecharge",
  "createTopUp",
  "subscribe",
  "createPortalSession"
] as const;

type Forward = (
  request: Record<string, unknown>,
  callback: grpc.requestCallback<unknown>
) => void;

const definition = () =>
  createServiceDefinition({
    serviceName: "Billing",
    pckg: "billing",
    proto: "billing.proto",
    version: "v1beta2"
  });

/**
 * The owner whose billing a call reads or changes: the caller, who must own the workspace the call
 * is made in (add-billing-service 6.1). Undefined otherwise.
 */
export function ownerOfCall(call: unknown): string | undefined {
  const grpcCall = call as grpc.ServerInterceptingCall;
  const accessKeyId = getAccessKeyIdFromCall(grpcCall);
  const token = decodeToken<TokenUseEnum.ACCESS>(getTokenFromCall(grpcCall));
  const owns = (token.access ?? []).some(
    (a) => a.accessKeyId === accessKeyId && a.role === Role.WORKSPACE_OWNER
  );
  return owns ? (token.sub as string | undefined) : undefined;
}

/**
 * The Billing API for the dashboard (billing.proto), when billing is on: each call is passed to
 * the billing service with owner_ref set from the caller, never from the request.
 */
function buildService(address: string, ownerOf = ownerOfCall) {
  const client = new (grpc.makeGenericClientConstructor(
    definition(),
    "Billing",
    {}
  ))(address, grpc.credentials.createInsecure()) as unknown as Record<
    string,
    Forward
  >;
  const forward =
    (method: (typeof METHODS)[number]) =>
    (
      call: { request: Record<string, unknown> },
      callback: (
        error: grpc.ServiceError | null | Partial<grpc.ServiceError>,
        response?: unknown
      ) => void
    ) => {
      const ownerRef = ownerOf(call);
      if (!ownerRef) {
        callback({
          code: grpc.status.PERMISSION_DENIED,
          message: "Only the workspace owner manages billing"
        });
        return;
      }
      client[method]({ ...call.request, ownerRef }, (error, response) => {
        if (error)
          logger.verbose("billing call refused", { method, code: error.code });
        callback(
          error ? { code: error.code, message: error.details } : null,
          response
        );
      });
    };
  return {
    definition: {
      serviceName: "Billing",
      pckg: "billing",
      version: "v1beta2",
      proto: "billing.proto"
    },
    handlers: Object.fromEntries(METHODS.map((m) => [m, forward(m)]))
  };
}

export { buildService };
