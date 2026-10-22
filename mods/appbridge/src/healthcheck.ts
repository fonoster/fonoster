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
/**
 * Container healthcheck and readiness probe (redesign-roomr 15.2): exits 0 when AppBridge's
 * Session port answers the standard gRPC health check (grpc.health.v1) with SERVING, 1 otherwise
 * (also while draining after SIGTERM, when it reports NOT_SERVING).
 *
 *   node /work/mods/appbridge/dist/healthcheck.js [host:port]   (default 127.0.0.1:50071)
 */
import * as grpc from "@grpc/grpc-js";
import { service as healthService } from "grpc-health-check";

const TIMEOUT_MS = 2000;

function checkHealth(
  address: string,
  timeoutMs = TIMEOUT_MS
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
        res?: { status?: string }
      ) => void
    ) => void;
  };
  return new Promise((resolve) => {
    client.Check(
      { service: "" },
      { deadline: Date.now() + timeoutMs },
      (error, res) => {
        client.close();
        resolve(!error && res?.status === "SERVING");
      }
    );
  });
}

// eslint-disable-next-line no-undef
if (require.main === module) {
  checkHealth(process.argv[2] ?? "127.0.0.1:50071").then((ok) =>
    process.exit(ok ? 0 : 1)
  );
}

export { checkHealth };
