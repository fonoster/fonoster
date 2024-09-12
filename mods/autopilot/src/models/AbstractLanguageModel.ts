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
import { AIMessage } from "@langchain/core/messages";
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createPromptTemplate } from "./createPromptTemplate";
import {
  InvocationResult,
  LanguageModel,
  LanguageModelParams,
  TelephonyContext
} from "./types";
import { ToolsCatalog } from "../tools";

const logger = getLogger({ service: "autopilot", filePath: __filename });

abstract class AbstractLanguageModel implements LanguageModel {
  private chain: ReturnType<typeof createChain>;
  private chatHistory: ReturnType<typeof createChatHistory>;
  private toolsCatalog: ToolsCatalog;

  constructor(params: LanguageModelParams, telephonyContext: TelephonyContext) {
    const { model, systemTemplate, knowledgeBase, tools } = params;
    const promptTemplate = createPromptTemplate(
      systemTemplate,
      telephonyContext
    );
    this.chatHistory = createChatHistory();
    this.toolsCatalog = new ToolsCatalog(tools);
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

    if (response.additional_kwargs?.tool_calls) {
      // eslint-disable-next-line no-loops/no-loops
      for (const toolCall of response.additional_kwargs.tool_calls) {
        const { arguments: args, name } = toolCall.function;

        logger.verbose(`invoking tool: ${name} with args: ${args}`);

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
            try {
              const toolResult = await toolsCatalog.invokeTool(
                name,
                JSON.parse(args)
              );

              logger.verbose("tool result: ", toolResult);

              await chatHistory.addAIMessage(
                `tool result: ${toolResult.result}`
              );
            } catch (error) {
              logger.error(`tool error: ${error.message}`);

              await chatHistory.addAIMessage(`tool error: ${error.message}`);
            }
        }
      }

      const finalResponse = (await chain.invoke({
        text: "Please provide a final response based on the tool results."
      })) as AIMessage;

      response.content = finalResponse.content ?? "";
    }

    await chatHistory.addUserMessage(text);
    await chatHistory.addAIMessage(response.content?.toString() ?? "");

    logger.verbose("system will say", { content: response.content });

    return {
      type: "say",
      content: response.content.toString()
    };
  }
}

export { AbstractLanguageModel };
