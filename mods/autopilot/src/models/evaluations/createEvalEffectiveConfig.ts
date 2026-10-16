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
import { SessionAssistant, testCasesSchema } from "@fonoster/common";
import { EvalAssistant, LlmProvider } from "../types";

const LLM_PROVIDERS: LlmProvider[] = [
  "openai",
  "groq",
  "ollama",
  "google",
  "anthropic"
];

/**
 * The session assistant as the evaluations run it: the catalog id split into provider and model,
 * with the keys the caller resolved (never stored in the assistant).
 */
export function createEvalEffectiveConfig(
  assistant: SessionAssistant,
  keys: { apiKey?: string; evaluationApiKey?: string }
): EvalAssistant {
  const [provider, ...rest] = assistant.languageModel.model.split("/");
  if (!LLM_PROVIDERS.includes(provider as LlmProvider))
    throw new Error(`evaluations do not support ${provider} models`);
  const testCases = testCasesSchema.parse(assistant.testCases);
  const {
    provider: _p,
    apiKey: _k,
    baseUrl: _b,
    ...languageModel
  } = assistant.languageModel;
  void _p;
  void _k;
  void _b;
  return {
    conversationSettings: assistant.conversationSettings,
    languageModel: {
      ...languageModel,
      provider: provider as LlmProvider,
      model: rest.join("/"),
      apiKey: keys.apiKey
    },
    testCases: {
      ...testCases,
      evalsLanguageModel: {
        ...testCases.evalsLanguageModel,
        apiKey: keys.evaluationApiKey
      }
    }
  };
}
