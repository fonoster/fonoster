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
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import {
  MeteredModel,
  usageLines,
  UsageSink
} from "../../session/meteredThink";

export function createTestTextSimilarity(
  evalsLanguageModel: {
    provider: any;
    model: string;
    baseUrl?: string;
    apiKey?: string;
  },
  systemPrompt: string,
  /** Meters the judge's tokens (add-usage-metering); the judge is always OpenAI. */
  usage?: { sink: UsageSink; keySource: MeteredModel["keySource"] }
) {
  if (!evalsLanguageModel.apiKey) {
    throw new Error("API key is required for text similarity evaluation.");
  }

  return async function testTextSimilarity(
    text1: string,
    text2: string
  ): Promise<boolean> {
    const llm = new ChatOpenAI({
      model: evalsLanguageModel.model,
      apiKey: evalsLanguageModel.apiKey,
      temperature: 0,
      maxTokens: 10
    });

    const messages = [
      new SystemMessage(systemPrompt),
      new HumanMessage(`Text 1: ${text1}\nText 2: ${text2}`)
    ];

    const response = await llm.invoke(messages);
    if (usage) {
      const model = {
        catalogId: `openai/${evalsLanguageModel.model}`,
        keySource: usage.keySource
      };
      const m = response.usage_metadata as
        | {
            input_tokens: number;
            output_tokens: number;
            input_token_details?: { cache_read?: number };
          }
        | undefined;
      if (m)
        usage.sink.usage(
          usageLines(model, {
            inputTokens: m.input_tokens,
            outputTokens: m.output_tokens,
            cachedTokens: m.input_token_details?.cache_read ?? 0
          })
        );
      else usage.sink.missing(model.catalogId);
    }
    const reply = response.content?.toString().trim().toLowerCase();

    return reply === "true" || reply === "yes";
  };
}
