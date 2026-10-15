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
import { Telemetry, TRACEPARENT_HEADER } from "@fonoster/common";
import { ServerInterceptingCall, status } from "@grpc/grpc-js";

/**
 * Every gRPC request as a span (`apiserver.grpc`, with rpc.method and rpc.grpc.status_code) and a
 * count (`fonoster.apiserver.grpc.requests` by method and code), add-platform 2.5. A `traceparent`
 * metadata entry from the caller joins its trace. Free when telemetry is disabled.
 */
export function createTelemetryInterceptor(telemetry: Telemetry) {
  return (methodDefinition: { path: string }, call: ServerInterceptingCall) => {
    if (!telemetry.enabled) return call;
    const method = methodDefinition.path;
    let span: ReturnType<Telemetry["startSpan"]> | undefined;
    return new ServerInterceptingCall(call, {
      start: (next) => {
        next({
          onReceiveMetadata: (metadata, mdNext) => {
            const parent = metadata.get(TRACEPARENT_HEADER)[0];
            span = telemetry.startSpan(
              "apiserver.grpc",
              { "rpc.system": "grpc", "rpc.method": method },
              typeof parent === "string" ? parent : undefined
            );
            mdNext(metadata);
          }
        });
      },
      sendStatus: (s, next) => {
        const code = status[s.code] ?? String(s.code);
        telemetry.count("fonoster.apiserver.grpc.requests", 1, {
          "rpc.method": method,
          "rpc.grpc.status_code": code
        });
        span?.end(
          { "rpc.grpc.status_code": s.code },
          s.code === status.OK ? undefined : code
        );
        next(s);
      }
    });
  };
}
