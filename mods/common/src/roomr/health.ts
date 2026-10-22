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
import * as grpc from "@grpc/grpc-js";
import { service as healthService } from "grpc-health-check";

/** How long one health check may take. */
export const HEALTH_CHECK_TIMEOUT_MS = 2000;

/**
 * Whether `address` (host:port) answers the standard gRPC health check (grpc.health.v1) with
 * SERVING for the server as a whole. False on any error, a timeout or any other status (a Roomr
 * node or AppBridge replica draining after SIGTERM reports NOT_SERVING). Through a Kubernetes
 * Service or a Compose service name the check reaches one ready replica.
 */
export function checkGrpcHealth(
  address: string,
  timeoutMs = HEALTH_CHECK_TIMEOUT_MS
): Promise<boolean> {
  const Health = grpc.makeGenericClientConstructor(healthService, "Health");
  const client = new Health(
    address,
    grpc.credentials.createInsecure()
  ) as unknown as grpc.Client & {
    Check: (
      req: { service: string },
      options: grpc.CallOptions,
      callback: (
        error: grpc.ServiceError | null,
        res?: { status?: string | number }
      ) => void
    ) => void;
  };
  return new Promise((resolve) => {
    client.Check(
      { service: "" },
      { deadline: Date.now() + timeoutMs },
      (error, res) => {
        client.close();
        resolve(!error && (res?.status === "SERVING" || res?.status === 1));
      }
    );
  });
}
