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
import {
  CallingNode,
  getCallingSettings,
  inspectWhatsAppNumber
} from "./inspectWhatsAppNumber";
import { runStep } from "./runStep";
import {
  EnableWhatsAppSipCallingParams,
  EnableWhatsAppSipCallingResult,
  WhatsAppLinkOptions
} from "./types";
import { WhatsAppLinkError } from "./WhatsAppLinkError";

const logger = getLogger({ service: "common", filePath: __filename });

/**
 * Meta requires a messaging limit of 2,000 or more for SIP calling. These tier names can't be
 * recorded with the owner's number, so they are the one fixture that comes from the prototype's
 * preflight (wp+routr provision/preflight.mjs) rather than from the baseline recording.
 */
const LOW_TIERS = ["TIER_50", "TIER_250", "TIER_1K"];

type CredentialedServer = {
  hostname?: string;
  port?: number | string;
  sip_user_password?: string;
};

/** Meta's `calling` object with every password removed, for `previousSettings`. */
function withoutPasswords(calling: CallingNode): Record<string, unknown> {
  const copy = JSON.parse(JSON.stringify(calling)) as Record<string, unknown>;
  const sip = copy.sip as Record<string, unknown> | undefined;
  if (sip) {
    delete sip.sip_user_password;
    if (Array.isArray(sip.servers)) {
      for (const server of sip.servers as Record<string, unknown>[]) {
        delete server.sip_user_password;
      }
    }
  }
  return copy;
}

/**
 * Enables SIP calling on a WhatsApp Business number with the given SIP server and SRTP mode, and
 * reads the Meta-issued SIP credentials back. Identical settings re-posted converge; the baseline
 * record says whether Meta keeps the same password on a re-post.
 */
async function enableWhatsAppSipCalling(
  credentials: WhatsAppCredentials,
  params: EnableWhatsAppSipCallingParams,
  options: WhatsAppLinkOptions = {}
): Promise<EnableWhatsAppSipCallingResult> {
  const { phoneNumberId, sipServer, srtpKeyExchange, additionalCodecs } =
    params;
  const client = createGraphClient(credentials, phoneNumberId, options);

  logger.verbose("enabling WhatsApp SIP calling", {
    phoneNumberId,
    hostname: sipServer.hostname
  });

  const info = await inspectWhatsAppNumber(
    credentials,
    { phoneNumberId },
    options
  );

  if (info.messagingLimitTier && LOW_TIERS.includes(info.messagingLimitTier)) {
    throw new WhatsAppLinkError(
      "TIER_TOO_LOW",
      `The number is on messaging tier ${info.messagingLimitTier}; WhatsApp calling needs a messaging limit of 2,000 or more`,
      "phoneNumbers.get"
    );
  }

  const previous = await getCallingSettings(client, true);

  await runStep("settings.post", () =>
    client.post(`/${client.phoneNumberId}/settings`, {
      calling: {
        status: "ENABLED",
        srtp_key_exchange_protocol: srtpKeyExchange,
        sip: {
          status: "ENABLED",
          webhook_delivery: "DISABLED",
          servers: [{ hostname: sipServer.hostname, port: sipServer.port }]
        },
        ...(additionalCodecs
          ? { audio: { additional_codecs: additionalCodecs } }
          : {})
      }
    })
  );

  const current = await getCallingSettings(client, true);
  const servers = (current.sip?.servers ?? []) as CredentialedServer[];
  const ours =
    servers.find((server) => server.hostname === sipServer.hostname) ??
    servers[0];
  const sipPassword =
    ours?.sip_user_password ??
    (current.sip as { sip_user_password?: string } | undefined)
      ?.sip_user_password;

  if (!sipPassword) {
    throw new Error(
      "Meta enabled SIP calling but returned no SIP password for the server"
    );
  }

  logger.verbose("enabled WhatsApp SIP calling", {
    phoneNumberId,
    hostname: sipServer.hostname
  });

  return {
    sipUsername: info.phoneNumber.replace(/^\+/, ""),
    sipPassword,
    phoneNumber: info.phoneNumber,
    previousSettings: withoutPasswords(previous)
  };
}

export { enableWhatsAppSipCalling, LOW_TIERS };
