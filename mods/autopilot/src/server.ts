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
import { AssistantConfig } from "./assistants";
import { Autopilot } from "./Autopilot";
import { OPENAI_API_KEY } from "./envs";
import { FilesKnowledgeBase } from "./knowledge/FilesKnowledgeBase";
import { OpenAI } from "./models/openai";
import { OpenAIModel } from "./models/openai/types";
import { SileroVad } from "./vad";
import { VoiceImpl } from "./voice";

const logger = getLogger({ service: "autopilot", filePath: __filename });

const skipIdentity = process.env.NODE_ENV === "dev";

new VoiceServer({ skipIdentity }).listen(
  async (req: VoiceRequest, res: VoiceResponse) => {
    const { ingressNumber, sessionRef, appRef } = req;
    logger.verbose("voice request", { ingressNumber, sessionRef, appRef });

    const voice = new VoiceImpl(req.sessionRef, res);
    const vad = new SileroVad();
    const knowledgeBase = new FilesKnowledgeBase({
      files: [`${process.cwd()}/etc/sample.pdf`]
    });

    const languageModel = new OpenAI({
      apiKey: OPENAI_API_KEY!,
      model: OpenAIModel.GPT_4O_MINI,
      maxTokens: 250,
      temperature: 0.7,
      systemTemplate: "You are a useful restaurant assistant.",
      knowledgeBase,
      tools: []
    });

    const assistantConfig = {} as AssistantConfig;

    const autopilot = new Autopilot({
      assistantConfig,
      voice,
      vad,
      languageModel
    });

    autopilot.start();
  }
);
