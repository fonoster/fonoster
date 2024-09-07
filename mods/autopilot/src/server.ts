#!/usr/bin/env node
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
import { getLogger } from "@fonoster/logger";
import VoiceServer, { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { OPENAI_API_KEY } from "./envs";
import Autopilot, {
  AssistantConfig,
  FilesKnowledgeBase,
  LanguageModelFactory,
  SileroVad,
  VoiceImpl,
  hangupToolDefinition,
  loadAndValidateAssistant,
  transferToolDefinition
} from ".";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const skipIdentity = process.env.NODE_ENV === "dev";

// TODO: This must be replaced with data from the API
const assistantPath = `${process.cwd()}/etc/assistant.example.json`;

const assistantConfig: AssistantConfig =
  loadAndValidateAssistant(assistantPath);

new VoiceServer({ skipIdentity }).listen(
  async (req: VoiceRequest, res: VoiceResponse) => {
    const { ingressNumber, sessionRef, appRef } = req;
    logger.verbose("voice request", { ingressNumber, sessionRef, appRef });

    const voice = new VoiceImpl(req.sessionRef, res);
    const vad = new SileroVad();

    const knowledgeBase = new FilesKnowledgeBase({
      files: [`${process.cwd()}/etc/sample.pdf`]
    });

    await knowledgeBase.load();

    const { conversationSettings, languageModel: languageModelSettings } =
      assistantConfig;
    const { systemTemplate } = conversationSettings;
    const { tools } = languageModelSettings;

    const languageModel = LanguageModelFactory.getLanguageModel(
      languageModelSettings.provider,
      {
        apiKey: OPENAI_API_KEY!,
        // @ts-ignore
        model: languageModelSettings.model,
        maxTokens: languageModelSettings.maxTokens,
        temperature: languageModelSettings.temperature,
        systemTemplate,
        knowledgeBase,
        tools: [...tools, hangupToolDefinition, transferToolDefinition]
      }
    );

    const autopilot = new Autopilot({
      conversationSettings,
      voice,
      vad,
      languageModel
    });

    autopilot.start();
  }
);
