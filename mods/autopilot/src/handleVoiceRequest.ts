// @ts-nocheck - All inputs are validated by the APIServer
/*
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
import { StreamEvent } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { createLanguageModel } from "./models/createLanguageModel";
import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
  KNOWLEDGE_BASE_ENABLED,
  UNSTRUCTURED_API_KEY,
  UNSTRUCTURED_API_URL,
  CONVERSATION_PROVIDER,
  CONVERSATION_PROVIDER_FILE,
  INTEGRATIONS_FILE
} from "./envs";
import { loadAssistantConfigFromFile } from "./loadAssistantConfigFromFile";
import Autopilot, { ConversationProvider, S3KnowledgeBase, VoiceImpl } from ".";
import { loadAssistantFromAPI } from "./loadAssistantFromAPI";
import fs from "fs";

const logger = getLogger({ service: "autopilot", filePath: __filename });

async function handleVoiceRequest(req: VoiceRequest, res: VoiceResponse) {
  const { accessKeyId, ingressNumber, sessionRef, appRef, callDirection } = req;

  logger.verbose("voice request", {
    accessKeyId,
    ingressNumber,
    sessionRef,
    appRef,
    metadata: req.metadata
  });

  const assistantConfig =
    CONVERSATION_PROVIDER === ConversationProvider.FILE
      ? loadAssistantConfigFromFile(CONVERSATION_PROVIDER_FILE)
      : await loadAssistantFromAPI(
          req,
          JSON.parse(fs.readFileSync(INTEGRATIONS_FILE, "utf8"))
        );

  let knowledgeBase;

  if (KNOWLEDGE_BASE_ENABLED) {
    knowledgeBase = new S3KnowledgeBase({
      bucket: req.accessKeyId.toLowerCase(),
      documents: assistantConfig.languageModel.knowledgeBase.map(
        (doc) => doc.document
      ),
      s3Config: {
        endpoint: AWS_S3_ENDPOINT,
        region: AWS_S3_REGION,
        credentials: {
          accessKeyId: AWS_S3_ACCESS_KEY_ID,
          secretAccessKey: AWS_S3_SECRET_ACCESS_KEY
        },
        forcePathStyle: true
      },
      unstructuredAPIURL: UNSTRUCTURED_API_URL,
      unstructuredAPIKey: UNSTRUCTURED_API_KEY
    });
  }

  knowledgeBase?.load().then(() => {
    logger.verbose("knowledge base loaded");
  });

  const voice = new VoiceImpl(sessionRef, res);

  const { ingressNumber, callerNumber, callDirection } = req;

  const languageModel = createLanguageModel({
    voice,
    assistantConfig,
    knowledgeBase,
    telephonyContext: {
      callDirection,
      ingressNumber,
      callerNumber
    }
  });

  const { conversationSettings } = assistantConfig;

  const autopilot = new Autopilot({
    conversationSettings,
    voice,
    languageModel
  });

  autopilot.start();

  res.on(StreamEvent.END, () => {
    autopilot.stop();
  });
}

export { handleVoiceRequest };
