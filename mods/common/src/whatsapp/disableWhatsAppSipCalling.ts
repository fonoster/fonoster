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
import { WhatsAppCredentials } from "@fonoster/types";
import { createGraphClient } from "./createGraphClient";
import { runStep } from "./runStep";
import { DisableWhatsAppSipCallingParams, WhatsAppLinkOptions } from "./types";

const logger = getLogger({ service: "common", filePath: __filename });

/**
 * Disables SIP calling on a WhatsApp Business number and clears its SIP servers. Also Meta's way
 * to rotate the SIP password: disable, then enable again.
 */
async function disableWhatsAppSipCalling(
  credentials: WhatsAppCredentials,
  params: DisableWhatsAppSipCallingParams,
  options: WhatsAppLinkOptions = {}
): Promise<void> {
  const client = createGraphClient(credentials, params.phoneNumberId, options);

  logger.verbose("disabling WhatsApp SIP calling", {
    phoneNumberId: params.phoneNumberId
  });

  await runStep("settings.post", () =>
    client.post(`/${client.phoneNumberId}/settings`, {
      calling: { sip: { status: "DISABLED", servers: [] } }
    })
  );
}

export { disableWhatsAppSipCalling };
