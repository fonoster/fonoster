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
// The session agent schema lives in @fonoster/common (rework-autopilot 5.1), so the control
// plane validates agents with the same rules Autopilot runs with.
export {
  sessionAgentSchema,
  sessionConversationSettingsSchema,
  sessionLanguageModelSchema
} from "@fonoster/common";
export type {
  SessionAgent,
  SessionConversationSettings,
  SessionLanguageModel,
  ToolDefinition
} from "@fonoster/common";
