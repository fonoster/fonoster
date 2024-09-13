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
import { getLogger } from "@fonoster/logger";
import { sendRequest } from "./sendRequest";
import { Tool } from "./type";

const logger = getLogger({ service: "autopilot", filePath: __filename });

class ToolsCatalog {
  private tools: Map<string, Tool>;

  constructor(tools: Tool[]) {
    this.tools = new Map();

    tools.forEach((tool) => {
      logger.verbose(`adding the '${tool.name}' tool to the catalog`);
      this.addTool(tool);
    });
  }

  async invokeTool(toolName: string, args: Record<string, unknown>) {
    const tool = this.tools.get(toolName);

    if (!tool) {
      throw new Error(`Tool '${toolName}' not found in the catalog`);
    }

    return await sendRequest({
      method: tool.operation.type,
      url: tool.operation.url!,
      waitForResponse: tool.operation.waitForResponse!,
      headers: tool.operation.headers,
      body: args
    });
  }

  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  addTool(toolDef: Tool) {
    this.tools.set(toolDef.name, toolDef);
  }

  listTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}

export { ToolsCatalog };
