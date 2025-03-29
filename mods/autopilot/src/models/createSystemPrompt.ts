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
import { TelephonyContext } from ".";

function createSystemPrompt(params: {
  firstMessage?: string;
  systemPrompt: string;
  telephonyContext: TelephonyContext;
}) {
  const { firstMessage: firstMessageFromSystem, systemPrompt } = params;
  const { ingressNumber, callerNumber, callDirection, metadata } =
    params.telephonyContext;
  const additionalParameters = Object.entries(metadata ?? {})
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");

  return `
${systemPrompt}

[Context Information]
{context}

[Call Details]
- System's First Message: ${firstMessageFromSystem}
- Current Time: ${new Date().toISOString()}
- Service Number: ${ingressNumber}
- Caller Number: ${callerNumber}
- Call Direction: ${callDirection}

${
  additionalParameters
    ? `[Additional Parameters (metadata)]
${additionalParameters}`
    : ""
}
  `;
}

export { createSystemPrompt };
