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
  Plugin,
  getServerCredentials,
  statusMap
} from "@fonoster/common";
import { createAuthInterceptor } from "@fonoster/identity";
import { getLogger } from "@fonoster/logger";
import * as grpc from "@grpc/grpc-js";
import merge from "deepmerge";
import { HealthImplementation } from "grpc-health-check";
import { createSession } from "./createSession";
import { defaultServerConfig } from "./defaultServerConfig";
import { IDENTITY_PUBLIC_KEY } from "./envs";
import { serviceDefinition } from "./serviceDefinition";
import { PluginsObject, ServerConfig, VoiceHandler } from "./types";

const logger = getLogger({ service: "voice", filePath: __filename });

const authorization = createAuthInterceptor(IDENTITY_PUBLIC_KEY, [
  "/grpc.health.v1.Health/Check",
  // FIXME: Create limited token and remove this
  "/fonoster.voice.v1beta2.Voice/CreateSession"
]);

export default class VoiceServer {
  config: ServerConfig;
  plugins: PluginsObject;
  constructor(config: ServerConfig = defaultServerConfig) {
    this.config = merge(defaultServerConfig, config);
    this.plugins = {} as PluginsObject;
  }

  /**
   * Add tts or asr plugin.
   *
   * @param {Plugin} plugin - The plugin to add
   */
  use(plugin: Plugin) {
    // Note: We only support registering one plugin per type
    this.plugins[plugin.getType()] = plugin;
  }

  async listen(handler: VoiceHandler) {
    const healthImpl = new HealthImplementation(statusMap);
    const credentials = await getServerCredentials({});

    const server = new grpc.Server({
      interceptors: [authorization]
    });

    server.addService(serviceDefinition, {
      createSession: createSession(handler, this.plugins)
    });

    // Add the health check service to the server
    healthImpl.addToServer(server);

    const bindAddr = `${this.config.bind}:${this.config.port}`;

    server.bindAsync(bindAddr, credentials, async () => {
      healthImpl.setStatus("", GRPC_SERVING_STATUS);
      logger.info(
        `started voice server @ ${this.config.bind}, port=${this.config.port}, path=${this.config.base}`
      );
    });
  }
}
