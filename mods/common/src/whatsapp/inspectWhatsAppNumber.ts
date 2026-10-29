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
import { WhatsAppCredentials } from "@fonoster/types";
import { createGraphClient, GraphClient } from "./createGraphClient";
import { runStep } from "./runStep";
import {
  CallingStatus,
  InspectWhatsAppNumberParams,
  SrtpKeyExchange,
  WhatsAppCallingSettings,
  WhatsAppLinkOptions,
  WhatsAppNumberInfo,
  WhatsAppSipServer
} from "./types";

const PHONE_NUMBER_FIELDS = [
  "verified_name",
  "display_phone_number",
  "code_verification_status",
  "quality_rating",
  "messaging_limit_tier"
].join(",");

type PhoneNumberNode = {
  verified_name?: string;
  display_phone_number?: string;
  quality_rating?: string;
  messaging_limit_tier?: string;
};

/** Meta's `calling` object; the shape the prototype saw, with the fields the link reads. */
type CallingNode = {
  status?: string;
  srtp_key_exchange_protocol?: string;
  sip?: {
    status?: string;
    servers?: { hostname?: string; port?: number | string }[];
  };
};

/** `display_phone_number` ("+52 55 1234 5678") as E.164. */
function toE164(display: string): string {
  return `+${display.replace(/\D/g, "")}`;
}

function toCallingSettings(calling: CallingNode): WhatsAppCallingSettings {
  const servers: WhatsAppSipServer[] = (calling.sip?.servers ?? [])
    .filter((server) => typeof server.hostname === "string")
    .map((server) => ({
      hostname: server.hostname as string,
      port: Number(server.port ?? 5061)
    }));

  return {
    status: calling.status as CallingStatus | undefined,
    srtpKeyExchange: calling.srtp_key_exchange_protocol as
      | SrtpKeyExchange
      | undefined,
    sip: { status: calling.sip?.status as CallingStatus | undefined, servers }
  };
}

/** `GET /<id>/settings`, with the SIP credentials when asked; returns Meta's `calling` object. */
async function getCallingSettings(
  client: GraphClient,
  includeCredentials: boolean
): Promise<CallingNode> {
  const settings = (await runStep(
    includeCredentials ? "settings.getCredentials" : "settings.get",
    () =>
      client.get(
        `/${client.phoneNumberId}/settings`,
        includeCredentials ? { include_sip_credentials: "true" } : undefined
      )
  )) as { calling?: CallingNode } | null;

  return settings?.calling ?? {};
}

/**
 * Reads what the link needs to know about a WhatsApp Business number: its E.164, verified name,
 * messaging tier, quality rating and current calling settings. Read-only.
 */
async function inspectWhatsAppNumber(
  credentials: WhatsAppCredentials,
  params: InspectWhatsAppNumberParams,
  options: WhatsAppLinkOptions = {}
): Promise<WhatsAppNumberInfo> {
  const client = createGraphClient(credentials, params.phoneNumberId, options);

  const node = (await runStep("phoneNumbers.get", () =>
    client.get(`/${client.phoneNumberId}`, { fields: PHONE_NUMBER_FIELDS })
  )) as PhoneNumberNode;

  const calling = await getCallingSettings(client, false);

  return {
    phoneNumber: toE164(node.display_phone_number ?? ""),
    verifiedName: node.verified_name,
    messagingLimitTier: node.messaging_limit_tier,
    qualityRating: node.quality_rating,
    calling: toCallingSettings(calling)
  };
}

export { CallingNode, getCallingSettings, inspectWhatsAppNumber, toE164 };
