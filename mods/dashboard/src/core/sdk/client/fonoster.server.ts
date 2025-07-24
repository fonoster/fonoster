/*
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
 * Fonoster Client (Server)
 *
 * @description This file exports a function to create a new instance of the
 * Fonoster Client for server-side environments. It uses the Node-specific build
 * of the Fonoster SDK and is configured via a predefined server config object.
 *
 * @note This wrapper allows centralized client configuration and caching,
 * which helps ensure consistent behavior and performance in server contexts.
 *
 * @TODO Remove this file when the Fonoster Client is officially exposed
 * by the main fonoster/sdk package in a platform-agnostic way.
 */

import * as SDK from "@fonoster/sdk/dist/node/node.js";
import { cache } from "react";
import { Logger } from "~/core/shared/logger";
import { RUNTIME_CONFIG } from "~/core/config/fonoster.runtime-config";

/**
 * Creates server configuration object from runtime config.
 * Used for server-side Client instances.
 */
const createServerConfig = () => {
  return Object.freeze({
    endpoint: RUNTIME_CONFIG.APISERVER_CONNECTION.grpc_address,
    accessKeyId: "",
    allowInsecure: RUNTIME_CONFIG.APISERVER_CONNECTION.allowInsecure,
    accessToken: ""
  });
};

/**
 * Creates and returns a memoized (cached) instance of the Fonoster Client
 * for server-side use, using runtime configuration.
 *
 * The `cache()` utility ensures that the same instance is reused across
 * multiple calls within the same request lifecycle (as used in server-rendered apps).
 *
 * @returns {Client} A configured instance of the Fonoster SDK Client for Node.js.
 */
export const getClient = cache(() => {
  const serverConfig = createServerConfig();
  Logger.debug(
    "[fonoster.server] Creating Fonoster Client instance with server config",
    serverConfig
  );
  return new SDK.Client(serverConfig);
});

/**
 * Re-export the Client class for type usage or advanced instantiation.
 */
export { SDK };
