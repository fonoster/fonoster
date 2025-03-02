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
import { getLogger } from "@fonoster/logger";
import twilio from "twilio";
import { SmsParams, TwilioSmsSenderConfig } from "./types";

const logger = getLogger({ service: "common", filePath: __filename });

function createSendSmsTwilioImpl(config: TwilioSmsSenderConfig) {
  const { sender: from, accountSid, authToken } = config;
  const client = twilio(accountSid, authToken);

  return async function sendSms(params: SmsParams): Promise<void> {
    const { to, body } = params;

    const result = await client.messages.create({
      body,
      from,
      to
    });

    logger.verbose("message sent", {
      status: result.status,
      messageId: result.sid
    });
  };
}

export { createSendSmsTwilioImpl };
