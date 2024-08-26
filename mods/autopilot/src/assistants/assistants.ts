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
import { OpenAIEmbeddings } from "@langchain/openai";
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createModel } from "./modelConfig";
import { createPromptTemplate } from "./promptTemplate";
import { createRAGComponents } from "./rag";
import { AssistantConfig } from "./types";

type Assistant = ReturnType<typeof makeAssistant>;

async function makeAssistant(config: AssistantConfig) {
  const model = createModel(config);
  const promptTemplate = createPromptTemplate(config.systemTemplate);
  const chatHistory = createChatHistory();
  const embeddings = new OpenAIEmbeddings();

  const { loadAndIndexURL, queryVectorStore, clearCache } =
    await createRAGComponents(embeddings);

  const chain = createChain(
    model,
    promptTemplate,
    queryVectorStore,
    chatHistory
  );

  return {
    invoke: async (input: { text: string; url?: string }) => {
      const { text, url } = input;

      if (url) {
        await loadAndIndexURL(url);
      }

      const response = await chain.invoke({ text });

      await chatHistory.addUserMessage(text);
      await chatHistory.addAIMessage(response);

      return response;
    },
    clearHistory: () => chatHistory.clear(),
    clearCache
  };
}

export { makeAssistant, Assistant };
