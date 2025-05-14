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
import { AIMessage } from "@langchain/core/messages";
import { ToolsCatalog } from "../tools";
import { Voice } from "../voice";
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

const logger = getLogger({ service: "autopilot", filePath: __filename });

abstract class AbstractLanguageModel implements LanguageModel {
  private readonly chain: ReturnType<typeof createChain>;
  private readonly chatHistory: ReturnType<typeof createChatHistory>;
  private readonly toolsCatalog: ToolsCatalog;
  private readonly voice: Voice;
  private readonly goodbyeMessage: string;
  private readonly firstMessage: string;
  private readonly transferOptions: { message: string };

  constructor(
    params: LanguageModelParams,
    voice: Voice,
    telephonyContext: TelephonyContext
  ) {
    const {
      model,
      firstMessage,
      transferOptions,
      systemPrompt,
      goodbyeMessage,
      knowledgeBase,
      tools
    } = params;
    this.chatHistory = createChatHistory();
    this.toolsCatalog = new ToolsCatalog(tools);
    this.voice = voice;
    this.firstMessage = firstMessage!;
    this.goodbyeMessage = goodbyeMessage!;
    this.transferOptions = transferOptions!;
    const promptTemplate = createPromptTemplate({
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

  async invoke(text: string, isReentry: boolean): Promise<InvocationResult> {
    const { chain, chatHistory, toolsCatalog } = this;
    const response = (await chain.invoke({ text })) as AIMessage;
    let isFirstTool = true;

    logger.verbose("invoke", {
      text,
      response: response.content,
      hasTools: (response.tool_calls?.length ?? 0) > 0,
      tools: response.tool_calls?.map((tool) => tool.name)
    });

    // This handles late speech recognition
    if (isReentry) {
      logger.verbose("reentry detected, discarding last conversation turn");
      const messages = await chatHistory.getMessages();
      messages.pop(); // Last AI message
      messages.pop(); // Last user message
    }

    // Begin the conversation with the first message
    if ((await chatHistory.getMessages()).length === 0 && this.firstMessage) {
      await chatHistory.addAIMessage(this.firstMessage);
    }

    if (response.tool_calls && response.tool_calls.length > 0) {
      // eslint-disable-next-line no-loops/no-loops
      for (const toolCall of response.tool_calls) {
        const { args, name: toolName } = toolCall;

        logger.verbose(
          `invoking tool: ${toolName} with args: ${JSON.stringify(args)}`,
          {
            isFirstTool
          }
        );

        switch (toolName) {
          case "hangup":
            await chatHistory.addUserMessage(text);
            await chatHistory.addAIMessage(this.goodbyeMessage);
            return {
              type: "hangup",
              content: "tool_result: call hangup initiated",
              toolCalls: response.tool_calls
            };
          case "transfer":
            await chatHistory.addUserMessage(text);
            await chatHistory.addAIMessage(this.transferOptions.message);
            return {
              type: "transfer",
              content: "tool_result: call transfer initiated",
              toolCalls: response.tool_calls
            };
          default:
            if (isFirstTool) {
              const tool = toolsCatalog.getTool(toolName);
              if (tool?.requestStartMessage) {
                await this.voice.say(tool?.requestStartMessage);
              }
            }

            await toolInvocation({
              args,
              chatHistory,
              isFirstTool,
              toolName,
              toolsCatalog
            });
            isFirstTool = false;
        }
      }

      const finalResponse = (await chain.invoke({
        text: "Write a quick message based on the tools results"
      })) as AIMessage;

      logger.verbose("finalResponse by AI", { content: finalResponse.content });

      response.content = finalResponse.content?.toString() ?? "";
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

  async getChatHistoryMessages() {
    return this.chatHistory.getMessages();
  }
}

export { AbstractLanguageModel };
