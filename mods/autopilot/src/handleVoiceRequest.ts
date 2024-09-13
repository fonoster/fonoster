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
import { StreamEvent } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { createLanguageModel } from "./createLanguageModel";
import { loadAssistantConfig } from "./loadAssistantConfig";
import { loadKnowledgeBase } from "./loadKnowledgeBase";
import Autopilot, { SileroVad, VoiceImpl } from ".";

const logger = getLogger({ service: "autopilot", filePath: __filename });

async function handleVoiceRequest(req: VoiceRequest, res: VoiceResponse) {
  const { ingressNumber, sessionRef, appRef } = req;
  logger.verbose("voice request", { ingressNumber, sessionRef, appRef });

  const assistantConfig = loadAssistantConfig();
  const knowledgeBase = await loadKnowledgeBase();

  const voice = new VoiceImpl(sessionRef, res);
  const vad = new SileroVad();

  const languageModel = createLanguageModel({
    voice,
    assistantConfig,
    knowledgeBase,
    telephonyContext: {
      ingressNumber: req.ingressNumber,
      callerNumber: req.callerNumber
    }
  });

  const autopilot = new Autopilot({
    conversationSettings: assistantConfig.conversationSettings,
    voice,
    vad,
    languageModel
  });

  autopilot.start();

  res.on(StreamEvent.END, () => {
    autopilot.stop();
  });
}

export { handleVoiceRequest };
