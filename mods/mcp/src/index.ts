#!/usr/bin/env node
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
import { readFileSync } from "fs";
import { join } from "path";
import { getLogger } from "@fonoster/logger";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerPrompts } from "./prompts/index";
import { registerTools } from "./tools/index";

const logger = getLogger({ service: "mcp", filePath: __filename });

async function main() {
  // Read package.json using fs module
  const packageJsonPath = join(__dirname, "..", "package.json");
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

  logger.info(`starting Fonoster MCP Server v${packageJson.version}`);

  const server = new McpServer({
    name: "Fonoster MCP Server",
    version: packageJson.version
  });

  // Register all prompts
  registerPrompts(server);
  logger.verbose("prompts registered successfully");

  // Register all tools
  await registerTools(server);
  logger.verbose("tools registered successfully");

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info("server connected and ready to accept requests");
}

main().catch((error) => {
  logger.error("failed to start MCP server", { error: error.message });
  process.exit(1);
});
