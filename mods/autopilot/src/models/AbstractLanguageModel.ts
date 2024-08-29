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
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createPromptTemplate } from "./createPromptTemplate";
import { LanguageModelParams } from "./types";
import { KnowledgeBase } from "../knowledge";

abstract class AbstractLanguageModel {
  private chain: ReturnType<typeof createChain>;
  private chatHistory: ReturnType<typeof createChatHistory>;
  private knowledgeBase: KnowledgeBase;
  private toolsByName: Record<string, any>;

  constructor(private params: LanguageModelParams) {
    this.knowledgeBase = params.knowledgeBase;
    const { model } = this.params;
    const promptTemplate = createPromptTemplate(this.params.systemTemplate);
    this.chatHistory = createChatHistory();
    this.chain = createChain(
      model,
      promptTemplate,
      this.knowledgeBase,
      this.chatHistory
    );
  }

  getToolByName(name: string) {
    return this.toolsByName[name];
  }

  async invoke(text: string) {
    const { chain, chatHistory, getToolByName } = this;

    const response = (await chain.invoke({ text })) as AIMessage;

    if (response.additional_kwargs?.tool_calls) {
      // eslint-disable-next-line no-loops/no-loops
      for (const toolCall of response.additional_kwargs.tool_calls) {
        const selectedTool = getToolByName(toolCall.function.name);
        if (selectedTool) {
          const args = JSON.parse(toolCall.function.arguments);
          const toolResult = await selectedTool.invoke(args);

          await this.chatHistory.addAIMessage(toolResult as string | "");
        }
      }

      const finalResponse = (await chain.invoke({
        text: "Please provide a final response based on the tool results."
      })) as AIMessage;

      response.content = finalResponse.content;
    }

    await chatHistory.addUserMessage(text);
    await chatHistory.addAIMessage(response.content?.toString() || "");

    return response.content.toString();
  }
}

export { AbstractLanguageModel };
