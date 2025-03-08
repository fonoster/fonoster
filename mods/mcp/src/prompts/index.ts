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
import { createCallPrompt } from "./createCallPrompt";

/**
 * Registers all prompts with the MCP server
 * @param server The MCP server instance
 */
export function registerPrompts(server: McpServer) {
  // Register the createCallPrompt
  server.prompt(
    "create_call_prompt",
    "A predefined prompt for creating a call",
    createCallPrompt
  );
}
