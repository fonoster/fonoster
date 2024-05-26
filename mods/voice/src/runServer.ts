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
import {
  GRPC_SERVING_STATUS,
  getServerCredentials,
  statusMap
} from "@fonoster/common";
import { createAuthInterceptor } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import { HealthImplementation } from "grpc-health-check";
import { BIND_ADDR, IDENTITY_PUBLIC_KEY } from "./envs";
import { serviceDefinition } from "./serviceDefinition";

const logger = getLogger({ service: "voice", filePath: __filename });

// const authorization = createAuthInterceptor(IDENTITY_PUBLIC_KEY, [
//   "/grpc.health.v1.Health/Check"
// ]);

async function runServer() {
  const healthImpl = new HealthImplementation(statusMap);
  const credentials = await getServerCredentials({});
  // const server = new grpc.Server({
  //   interceptors: [authorization]
  // });

  const server = new grpc.Server();

  server.addService(serviceDefinition, {
    createSession: (call) => {
      logger.info("createSession", call.request);

      call.on("data", (request) => {
        logger.info("received CreateSessionRequest", request.request);
        call.write({ answerCommand: { sessionId: "123" } });
        call.write({ hangupCommand: { sessionId: "123" } });
        call.end();
      });

      call.on("end", () => {
        logger.info("client ended stream");
        call.end();
      });

      call.on("error", (error) => {
        logger.error("stream error", error);
      });
    }
  });

  // Add the health check service to the server
  healthImpl.addToServer(server);

  server.bindAsync(BIND_ADDR, credentials, async () => {
    healthImpl.setStatus("", GRPC_SERVING_STATUS);
    logger.info(`voice server running at ${BIND_ADDR}`);
  });
}

export { runServer };
