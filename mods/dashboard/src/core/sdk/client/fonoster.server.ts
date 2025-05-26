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
 * @description This file exports the Fonoster Client for the server. It is used to
 * create a new instance of the Fonoster Client for the server.
 *
 * @TODO: This file should be removed when the Fonoster Client is moved to the fonoster/sdk package.
 */
import { Client } from "@fonoster/sdk/dist/node/node.js";
import { FONOSTER_SERVER_CONFIG } from "../stores/fonoster.config";
import { cache } from "react";

export const getClient = cache(() => {
  const fonosterClient = new Client(FONOSTER_SERVER_CONFIG);

  return fonosterClient;
});

export { Client };
