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
import { getLogger } from "@fonoster/logger";
import { ToolsCatalog } from "../tools";
import { createChatHistory } from "./chatHistory";

const logger = getLogger({ service: "autopilot", filePath: __filename });

async function toolInvocation(params: {
  toolName: string;
  chatHistory: ReturnType<typeof createChatHistory>;
  toolsCatalog: ToolsCatalog;
  isFirstTool: boolean;
  args: Record<string, unknown>;
}): Promise<string> {
  const { isFirstTool, args, toolName, chatHistory, toolsCatalog } = params;

  try {
    if (isFirstTool) {
      const tool = toolsCatalog.getTool(toolName);
      const message = tool?.requestStartMessage ?? "";
      if (message) {
        await chatHistory.addAIMessage(message);
      }
    }

    const toolResult = await toolsCatalog.invokeTool(toolName, args);

    logger.verbose(`tool result (${toolName}):`, { result: toolResult.result });

    await chatHistory.addAIMessage(
      `tool result (${toolName}): ${toolResult.result}`
    );

    return toolResult.result;
  } catch (error) {
    logger.error(`tool error: ${error.message}`);

    await chatHistory.addAIMessage(`tool error: ${error.message}`);

    return "";
  }
}

export { toolInvocation };
