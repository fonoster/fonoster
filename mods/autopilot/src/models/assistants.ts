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
import { VoiceResponse } from "@fonoster/voice";
import { AIMessage } from "@langchain/core/messages";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createChatHistory } from "./chatHistory";
import { createChain } from "./createChain";
import { createModel } from "./createModel";
import { createPromptTemplate } from "./createPromptTemplate";
import { makeHangupTool } from "./tools";
import { AssistantConfig } from "./types";
import { createRAGComponents } from "../knowledge/createRAGComponents";

type Assistant = ReturnType<typeof makeAssistant>;

async function makeAssistant(config: AssistantConfig, voice: VoiceResponse) {
  const model = createModel(config, voice);
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

  const toolsByName = {
    hangup: makeHangupTool(voice)
  };

  return {
    invoke: async (input: { text: string; url?: string }) => {
      const { text, url } = input;

      if (url) {
        await loadAndIndexURL(url);
      }

      // Invoke the chain
      const response = (await chain.invoke({ text })) as AIMessage;

      if (response.additional_kwargs?.tool_calls) {
        // eslint-disable-next-line no-loops/no-loops
        for (const toolCall of response.additional_kwargs.tool_calls) {
          const selectedTool = toolsByName[toolCall.function.name];
          if (selectedTool) {
            const args = JSON.parse(toolCall.function.arguments);
            const toolResult = await selectedTool.invoke(args);

            await chatHistory.addAIMessage(toolResult as string | "");
          }
        }
        // After handling tool calls, invoke the chain again to get the final response
        const finalResponse = (await chain.invoke({
          text: "Please provide a final response based on the tool results."
        })) as AIMessage;

        response.content = finalResponse.content;
      }

      // Update chat history
      await chatHistory.addUserMessage(text);
      await chatHistory.addAIMessage(response.content?.toString() || "");

      return response.content.toString();
    },
    clearHistory: () => chatHistory.clear(),
    clearCache
  };
}

export { makeAssistant, Assistant };
