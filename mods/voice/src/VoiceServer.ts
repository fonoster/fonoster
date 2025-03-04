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
  createAuthInterceptor,
  getPublicKey,
  getServerCredentials,
  GRPC_SERVING_STATUS,
  statusMap
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import merge from "deepmerge";
import { HealthImplementation } from "grpc-health-check";
import { createSession } from "./createSession";
import { defaultServerConfig } from "./defaultServerConfig";
import { serviceDefinition } from "./serviceDefinition";
import { ServerConfig, VoiceHandler } from "./types";

const logger = getLogger({ service: "voice", filePath: __filename });

export default class VoiceServer {
  config: ServerConfig;
  constructor(config: ServerConfig = defaultServerConfig) {
    this.config = merge(defaultServerConfig, config);
  }

  async listen(handler: VoiceHandler) {
    try {
      const healthImpl = new HealthImplementation(statusMap);
      const credentials = await getServerCredentials({});

      let server: grpc.Server;

      if (this.config.skipIdentity) {
        server = new grpc.Server();
      } else {
        // Get the public key from the identity service
        const response = await getPublicKey(this.config.identityAddress);

        const authorization = createAuthInterceptor(response.publicKey, [
          "/grpc.health.v1.Health/Check"
        ]);

        server = new grpc.Server({
          interceptors: [authorization]
        });
      }

      server.addService(serviceDefinition, {
        createSession: createSession(handler)
      });

      // Add the health check service to the server
      healthImpl.addToServer(server);

      const bindAddr = `${this.config.bind}:${this.config.port}`;

      server.bindAsync(bindAddr, credentials, async () => {
        healthImpl.setStatus("", GRPC_SERVING_STATUS);
        logger.info(
          `started voice server @ ${this.config.bind}, port=${this.config.port}`
        );
      });
    } catch (err) {
      if (err.code === grpc.status.UNAVAILABLE) {
        logger.error("failed to connect to identity service");
      } else {
        logger.error("failed to start voice server", err);
      }
      process.exit(1);
    }
  }
}
