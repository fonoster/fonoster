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
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  ChatPromptTemplate,
  MessagesPlaceholder
} from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatMessageHistory } from "langchain/stores/message/in_memory";
import { AssistantConfig } from "./types";

type Assistant = ReturnType<typeof makeAssistant>;

function makeAssistant(config: AssistantConfig) {
  const model = new ChatOpenAI({
    model: config.model,
    apiKey: config.apiKey,
    maxTokens: config.maxTokens,
    temperature: config.temperature
  });

  const { systemTemplate } = config;

  const parser = new StringOutputParser();

  const chatHistory = new ChatMessageHistory();

  const promptTemplate = ChatPromptTemplate.fromMessages([
    ["system", systemTemplate],
    new MessagesPlaceholder("history"),
    ["human", "{text}"]
  ]);

  const chain = promptTemplate.pipe(model).pipe(parser);

  return {
    invoke: async (input: { text: string }) => {
      const { text } = input;
      const response = await chain.invoke({
        text,
        history: await chatHistory.getMessages()
      });

      await chatHistory.addMessage(new HumanMessage(text));
      await chatHistory.addMessage(new AIMessage(response));

      return response;
    },
    clearHistory: () => chatHistory.clear()
  };
}

export { makeAssistant, Assistant };
