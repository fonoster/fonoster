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
import { ConversationSettings } from "../assistants";
import { LanguageModel } from "../models";
import { Voice } from "../voice";

const context = ({
  input
}: {
  input: {
    voice: Voice;
    languageModel: LanguageModel;
    conversationSettings: ConversationSettings;
  };
}) => ({
  sessionRef: input.voice.sessionRef,
  voice: input.voice,
  languageModel: input.languageModel,
  speechBuffer: "",
  firstMessage: input.conversationSettings.firstMessage,
  goodbyeMessage: input.conversationSettings.goodbyeMessage,
  transferMessage: input.conversationSettings.transferOptions?.message,
  transferPhoneNumber: input.conversationSettings.transferOptions?.phoneNumber,
  transferTimeout: input.conversationSettings.transferOptions?.timeout,
  systemErrorMessage: input.conversationSettings.systemErrorMessage,
  idleMessage: input.conversationSettings.idleOptions.message,
  idleTimeout: input.conversationSettings.idleOptions.timeout,
  maxIdleTimeoutCount: input.conversationSettings.idleOptions.maxTimeoutCount,
  idleTimeoutCount: 0,
  maxSpeechWaitTimeout: input.conversationSettings.maxSpeechWaitTimeout,
  allowUserBargeIn: input.conversationSettings.allowUserBargeIn,
  sessionStartTime: Date.now(),
  maxSessionDuration: input.conversationSettings.maxSessionDuration,
  initialDtmf: input.conversationSettings.initialDtmf,
  previousState: null,
  hasLateSpeech: false,
  isFirstTurn: true
});

export { context };
