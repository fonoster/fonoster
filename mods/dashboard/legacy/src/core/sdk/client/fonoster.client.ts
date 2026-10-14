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
 * Fonoster Client (Browser)
 *
 * @description This file exports a function to create a new instance of the
 * Fonoster WebClient, configured specifically for browser environments.
 *
 * @note This wrapper exists to isolate browser-specific client creation logic.
 * Once the Fonoster SDK exposes proper browser support directly, this file can be safely removed.
 *
 * @TODO Remove this file when the Fonoster Client is fully supported from the main SDK entry point.
 */

import * as SDK from "@fonoster/sdk/dist/web/index.esm.js";
import { FONOSTER_CLIENT_CONFIG } from "../stores/fonoster.config";
import { Logger } from "~/core/shared/logger";

/**
 * Creates a new instance of the Fonoster WebClient using predefined configuration.
 *
 * @returns {Client} An instance of the Fonoster WebClient, ready for use in browser-based applications.
 */
export const getClient = () => {
  Logger.debug("[fonoster.client] Creating Fonoster WebClient instance");

  const fonosterClient = new SDK.WebClient(FONOSTER_CLIENT_CONFIG);
  return fonosterClient;
};

/**
 * Export the WebClient type or constructor for external type annotations or manual instantiation if needed.
 */
export { SDK };
