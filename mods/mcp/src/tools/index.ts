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
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreateCallBatchSchema,
  CreateCallSchema,
  ListApplicationsSchema,
  ListNumbersSchema
} from "../schemas";
import { createClient } from "../utils/createClient";
import { createCreateCall } from "./createCreateCall";
import { createCreateCallBatch } from "./createCreateCallBatch";
import { createListApplications } from "./createListApplications";
import { createListNumbers } from "./createListNumbers";

/**
 * Registers all tools with the MCP server
 * @param server The MCP server instance
 * @param client The Fonoster client
 */
export async function registerTools(server: McpServer) {
  const client = await createClient();

  server.tool(
    "list_numbers",
    "Returns a list of numbers from Fonoster in a table format (using markdown)",
    ListNumbersSchema.shape as Record<string, unknown>,
    createListNumbers(client)
  );

  server.tool(
    "list_applications",
    "Lists applications from Fonoster in a table format (using markdown)",
    ListApplicationsSchema.shape as Record<string, unknown>,
    createListApplications(client)
  );

  server.tool(
    "create_call",
    "Creates a call from Fonoster",
    CreateCallSchema.shape as Record<string, unknown>,
    createCreateCall(client)
  );

  server.tool(
    "create_call_batch",
    "Creates a batch of calls from Fonoster",
    CreateCallBatchSchema.shape as Record<string, unknown>,
    createCreateCallBatch(client)
  );
}
