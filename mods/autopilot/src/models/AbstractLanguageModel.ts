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
import { getLogger } from "@fonoster/logger";
import { AIMessage } from "@langchain/core/messages";
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createPromptTemplate } from "./createPromptTemplate";
import { toolInvocation } from "./toolInvocation";
import {
  InvocationResult,
  LanguageModel,
  LanguageModelParams,
  TelephonyContext
} from "./types";
import { ToolsCatalog } from "../tools";
import { Voice } from "../voice";

const logger = getLogger({ service: "autopilot", filePath: __filename });

abstract class AbstractLanguageModel implements LanguageModel {
  private readonly chain: ReturnType<typeof createChain>;
  private readonly chatHistory: ReturnType<typeof createChatHistory>;
  private readonly toolsCatalog: ToolsCatalog;
  private readonly voice: Voice;

  constructor(
    params: LanguageModelParams,
    voice: Voice,
    telephonyContext: TelephonyContext
  ) {
    const { model, firstMessage, systemPrompt, knowledgeBase, tools } = params;
    this.chatHistory = createChatHistory();
    this.toolsCatalog = new ToolsCatalog(tools);
    this.voice = voice;
    const promptTemplate = createPromptTemplate({
      firstMessage,
      systemPrompt,
      telephonyContext
    });
    this.chain = createChain(
      model,
      knowledgeBase,
      promptTemplate,
      this.chatHistory
    );
  }

  async invoke(text: string): Promise<InvocationResult> {
    const { chain, chatHistory, toolsCatalog } = this;
    const response = (await chain.invoke({ text })) as AIMessage;
    let isFirstTool = true;

    if (response.tool_calls && response.tool_calls.length > 0) {
      // eslint-disable-next-line no-loops/no-loops
      for (const toolCall of response.tool_calls) {
        const { args, name } = toolCall;

        logger.verbose(
          `invoking tool: ${name} with args: ${JSON.stringify(args)}`,
          {
            isFirstTool
          }
        );

        switch (name) {
          case "hangup":
            await chatHistory.addAIMessage(
              "tool result: call hangup initiated"
            );
            return { type: "hangup" };
          case "transfer":
            await chatHistory.addAIMessage(
              "tool result: call transfer initiated"
            );

            return { type: "transfer" };
          default:
            if (isFirstTool) {
              const tool = toolsCatalog.getTool(name);
              await this.voice.say(tool?.requestStartMessage ?? "");
            }

            await toolInvocation({
              args,
              chatHistory,
              isFirstTool,
              toolName: name,
              toolsCatalog
            });
            isFirstTool = false;
        }
      }

      const finalResponse = (await chain.invoke({
        text: "Look at the tool calls and provide a final response based on the tool's results."
      })) as AIMessage;

      response.content = finalResponse.content ?? "";
    }

    await chatHistory.addUserMessage(text);
    await chatHistory.addAIMessage(response.content?.toString() ?? "");

    logger.verbose("system will say", { content: response.content });

    return {
      type: "say",
      content: response.content.toString(),
      toolCalls: response.tool_calls
    };
  }
}

export { AbstractLanguageModel };
