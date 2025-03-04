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
import {
  AssistantConfig,
  hangupToolDefinition,
  KnowledgeBase,
  LanguageModelFactory,
  TelephonyContext,
  transferToolDefinition,
  Voice
} from "..";

function createLanguageModel(params: {
  voice: Voice;
  assistantConfig: AssistantConfig;
  knowledgeBase: KnowledgeBase;
  telephonyContext: TelephonyContext;
}) {
  const { voice, assistantConfig, knowledgeBase, telephonyContext } = params;
  const { languageModel, conversationSettings } = assistantConfig;

  // The transfer tool is only added if the transfer options exist
  const tools = languageModel.tools.concat(
    conversationSettings.transferOptions
      ? [hangupToolDefinition, transferToolDefinition]
      : [hangupToolDefinition]
  );

  return LanguageModelFactory.getLanguageModel(
    languageModel.provider,
    {
      ...languageModel,
      ...conversationSettings,
      knowledgeBase,
      tools
    } as any,
    voice,
    telephonyContext
  );
}

export { createLanguageModel };
