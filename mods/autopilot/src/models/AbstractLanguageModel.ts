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
import { AIMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createPromptTemplate } from "./createPromptTemplate";
import { LanguageModelParams } from "./types";

abstract class AbstractLanguageModel {
  private chain: ReturnType<typeof createChain>;
  private chatHistory: ReturnType<typeof createChatHistory>;
  private tools: DynamicStructuredTool[] = [];

  constructor(private params: LanguageModelParams) {
    const { model, tools, systemTemplate, knowledgeBase } = this.params;

    const promptTemplate = createPromptTemplate(systemTemplate);
    this.chatHistory = createChatHistory();
    this.tools = tools;
    this.chain = createChain(
      model,
      knowledgeBase,
      promptTemplate,
      this.chatHistory
    );
  }

  async invoke(text: string) {
    const { chain, chatHistory, tools } = this;
    const response = (await chain.invoke({ text })) as AIMessage;

    if (response.additional_kwargs?.tool_calls) {
      // eslint-disable-next-line no-loops/no-loops
      for (const toolCall of response.additional_kwargs.tool_calls) {
        const selectedTool = tools.find(
          (tool) => tool.name === toolCall.function.name
        );

        if (selectedTool) {
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await selectedTool.invoke(args);

          await this.chatHistory.addAIMessage(
            `function call: ${toolResult.name}`
          );
        }
      }

      const finalResponse = (await chain.invoke({
        text: "Please provide a final response based on the tool results."
      })) as AIMessage;

      response.content = finalResponse.content ?? "";
    }

    await chatHistory.addUserMessage(text);
    await chatHistory.addAIMessage(response.content?.toString() ?? "");

    return response.content.toString();
  }
}

export { AbstractLanguageModel };
