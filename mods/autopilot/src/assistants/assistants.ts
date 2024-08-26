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
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createChatHistory } from "./chatHistory";
import { createModel } from "./modelConfig";
import { createPromptTemplate } from "./promptTemplate";
import { AssistantConfig } from "./types";

type Assistant = ReturnType<typeof makeAssistant>;

function makeAssistant(config: AssistantConfig) {
  const model = createModel(config);
  const promptTemplate = createPromptTemplate(config.systemTemplate);
  const chatHistory = createChatHistory();
  const parser = new StringOutputParser();

  const chain = promptTemplate.pipe(model).pipe(parser);

  return {
    invoke: async (input: { text: string }) => {
      const { text } = input;
      const response = await chain.invoke({
        text,
        history: await chatHistory.getMessages()
      });

      await chatHistory.addUserMessage(text);
      await chatHistory.addAIMessage(response);

      return response;
    },
    clearHistory: () => chatHistory.clear()
  };
}

export { makeAssistant, Assistant };
