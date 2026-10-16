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
// The LLM adapter interface and the OpenAI-compatible adapter live in @fonoster/community with
// the other vendor adapters (registry 3.1).
export {
  ChatMessage,
  Think,
  ThinkChunk,
  ThinkError,
  ThinkProvider,
  ToolCall,
  ToolSpec
} from "@fonoster/community";
export {
  OpenAiCompatibleThink,
  resolveThink
} from "@fonoster/community/openai";
