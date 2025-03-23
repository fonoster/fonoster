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
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  MessagesPlaceholder,
  SystemMessagePromptTemplate
} from "@langchain/core/prompts";
import { TelephonyContext } from "./types";

export function createPromptTemplate(params: {
  firstMessage?: string;
  systemPrompt: string;
  telephonyContext: TelephonyContext;
}) {
  const { firstMessage, systemPrompt, telephonyContext } = params;

  return ChatPromptTemplate.fromMessages([
    SystemMessagePromptTemplate.fromTemplate(
      `${systemPrompt}

       [First Message from System]
       ${firstMessage}

       [Context]
       {context}

       [Call Information]
       callReceivedAt: ${new Date().toISOString()}
       ingressNumber: ${telephonyContext.ingressNumber}
       callerNumber: ${telephonyContext.callerNumber}
       callDirection: ${telephonyContext.callDirection}
       `
    ),
    new MessagesPlaceholder("history"),
    HumanMessagePromptTemplate.fromTemplate("{input}")
  ]);
}
