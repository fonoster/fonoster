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
import fs from "fs";
import { StreamEvent } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceRequest, VoiceResponse } from "@fonoster/voice";
import { BaseMessage } from "@langchain/core/messages";
import {
  AWS_S3_ACCESS_KEY_ID,
  AWS_S3_ENDPOINT,
  AWS_S3_REGION,
  AWS_S3_SECRET_ACCESS_KEY,
  CONVERSATION_PROVIDER,
  CONVERSATION_PROVIDER_FILE,
  INTEGRATIONS_FILE,
  KNOWLEDGE_BASE_ENABLED,
  UNSTRUCTURED_API_KEY,
  UNSTRUCTURED_API_URL
} from "./envs";
import { loadAssistantConfigFromFile } from "./loadAssistantConfigFromFile";
import { loadAssistantFromAPI } from "./loadAssistantFromAPI";
import { createLanguageModel } from "./models/createLanguageModel";
import {
  EventsHook,
  sendConversationEndedEvent
} from "./sendConversationEndedEvent";
import Autopilot, {
  ConversationProvider,
  ConversationSettings,
  LanguageModel,
  S3KnowledgeBase,
  VoiceImpl
} from ".";

const logger = getLogger({ service: "autopilot", filePath: __filename });

async function handleVoiceRequest(req: VoiceRequest, res: VoiceResponse) {
  const {
    accessKeyId,
    callerNumber,
    ingressNumber,
    sessionRef,
    appRef,
    callDirection,
    metadata
  } = req;

  logger.verbose("voice request", {
    accessKeyId,
    ingressNumber,
    sessionRef,
    appRef,
    metadata
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
    const documents = assistantConfig.languageModel?.knowledgeBase?.map(
      (doc) => doc.document
    ) as string[];

    logger.verbose("loading knowledge base", {
      documents,
      bucket: req.accessKeyId.toLowerCase()
    });

    knowledgeBase = new S3KnowledgeBase({
      bucket: req.accessKeyId.toLowerCase(),
      documents,
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

  const languageModel = createLanguageModel({
    voice,
    assistantConfig,
    knowledgeBase,
    telephonyContext: {
      callDirection,
      ingressNumber,
      callerNumber,
      metadata
    }
  });

  const { conversationSettings } = assistantConfig;

  try {
    const autopilot = new Autopilot({
      conversationSettings: conversationSettings as ConversationSettings,
      voice: voice as VoiceImpl,
      languageModel: languageModel as LanguageModel
    });

    await autopilot.start();

    res.on(StreamEvent.END, async () => {
      autopilot.stop();

      const rawChatHistory = await languageModel.getChatHistoryMessages();
      const chatHistory = rawChatHistory
        .map((msg: BaseMessage) => {
          if (msg.constructor.name === "HumanMessage") {
            return { human: msg.content };
          } else if (msg.constructor.name === "AIMessage") {
            return { ai: msg.content };
          }
          return null;
        })
        .filter(Boolean);

      if (assistantConfig.eventsHook?.url) {
        await sendConversationEndedEvent(
          assistantConfig.eventsHook as EventsHook,
          {
            chatHistory: chatHistory as Record<string, string>[],
            phone: ingressNumber,
            appRef,
            sessionRef
          }
        );
      }
    });
  } catch (error) {
    logger.error("error handling voice request", { error });
  }
}

export { handleVoiceRequest };
