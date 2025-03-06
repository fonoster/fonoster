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
import * as SDK from "@fonoster/sdk";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreateCallSchema,
  ListApplicationsSchema,
  ListNumbersSchema
} from "../schemas";
import { createCreateCall } from "./createCreateCall";
import { createListApplications } from "./createListApplications";
import { createListNumbers } from "./createListNumbers";
import { createClient } from "../utils/createClient";

/**
 * Registers all tools with the MCP server
 * @param server The MCP server instance
 * @param client The Fonoster client
 */
export async function registerTools(server: McpServer) {
  const client = await createClient();

  // Register the listNumbers tool
  server.tool(
    "list_numbers",
    "Returns a list of numbers from Fonoster in a table format (using markdown)",
    ListNumbersSchema.shape,
    createListNumbers(client)
  );

  // Register the listApplications tool
  server.tool(
    "list_applications",
    "Lists applications from Fonoster in a table format (using markdown)",
    ListApplicationsSchema.shape,
    createListApplications(client)
  );

  // Register the createCall tool
  server.tool(
    "create_call",
    "Creates a call from Fonoster",
    CreateCallSchema.shape,
    createCreateCall(client)
  );
}
