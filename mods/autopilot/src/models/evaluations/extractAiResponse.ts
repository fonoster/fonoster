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
import { EvalAgent, InvocationResult } from "../types";

/**
 * Maps language model invocation result to the text that should be compared
 * in eval (hangup/transfer use config messages).
 */
export function extractAiResponse(
  response: InvocationResult,
  agentConfig: EvalAgent
): string {
  if (response.toolCalls && response.toolCalls.length > 0) {
    const topTool = response.toolCalls[0];
    if (topTool.name === "hangup") {
      return agentConfig.conversationSettings?.goodbyeMessage ?? "";
    }
    if (topTool.name === "transfer") {
      return agentConfig.conversationSettings?.transferOptions?.message ?? "";
    }
  }
  return response.content ?? "";
}
