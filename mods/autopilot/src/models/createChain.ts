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
import { RunnableSequence } from "@langchain/core/runnables";
import { createChatHistory } from "./chatHistory";
import { createModel } from "./createModel";
import { createPromptTemplate } from "./createPromptTemplate";

function createChain(
  model: ReturnType<typeof createModel>,
  promptTemplate: ReturnType<typeof createPromptTemplate>,
  queryVectorStore: (query: string, k?: number) => Promise<string>,
  chatHistory: ReturnType<typeof createChatHistory>
) {
  return RunnableSequence.from([
    {
      input: (input) => input.text,
      context: async (input) => queryVectorStore(input.text),
      history: async () => chatHistory.getMessages()
    },
    promptTemplate,
    model
  ]);
}

export { createChain };
