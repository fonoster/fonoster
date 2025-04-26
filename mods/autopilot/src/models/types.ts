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
import { CallDirection } from "@fonoster/types";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ToolCall } from "@langchain/core/messages/tool";
import { KnowledgeBase } from "../knowledge";
import { Tool } from "../tools/types";

type LanguageModel = {
  invoke: (text: string, isReentry?: boolean) => Promise<InvocationResult>;
};

type BaseModelParams = {
  firstMessage?: string;
  goodbyeMessage?: string;
  transferOptions: { message: string };
  systemPrompt: string;
  knowledgeBase: KnowledgeBase;
  tools: Tool[];
  telephonyContext: TelephonyContext;
};

type LanguageModelParams = BaseModelParams & {
  model: BaseChatModel;
};

type InvocationResult = {
  type: "say" | "hangup" | "transfer";
  content?: string;
  toolCalls?: ToolCall[];
};

type TelephonyContext = {
  callDirection: CallDirection;
  ingressNumber: string;
  callerNumber: string;
  metadata?: Record<string, string>;
};

export {
  BaseModelParams,
  InvocationResult,
  LanguageModel,
  LanguageModelParams,
  TelephonyContext
};
