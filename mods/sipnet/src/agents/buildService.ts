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
import SDK from "@routr/sdk";
import { ClientOptions } from "../types";
import {
  createAgent,
  deleteAgent,
  getAgent,
  listAgents,
  updateAgent
} from "./operations";

function buildService(clientOptions: ClientOptions) {
  const client = new SDK.Agents(clientOptions);

  return {
    definition: {
      serviceName: "Agents",
      pckg: "agents",
      version: "v1beta2",
      proto: "agents.proto"
    },
    handlers: {
      createAgent: createAgent(client),
      updateAgent: updateAgent(client),
      getAgent: getAgent(client),
      listAgents: listAgents(client),
      deleteAgent: deleteAgent(client)
    }
  };
}

export { buildService };
