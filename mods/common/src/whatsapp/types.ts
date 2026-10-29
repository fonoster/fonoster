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
type WhatsAppLinkOptions = {
  /** Replaces the global fetch; tests pass the Graph API fake. */
  fetch?: typeof globalThis.fetch;
};

/** The SIP server Meta sends the number's calls to, as registered on the phone number. */
type WhatsAppSipServer = { hostname: string; port: number };

/** How Meta and the media relay agree on SRTP keys (Meta's `srtp_key_exchange_protocol`). */
type SrtpKeyExchange = "SDES" | "DTLS";

type CallingStatus = "ENABLED" | "DISABLED";

/** The phone number's calling settings, as Meta's `GET /<id>/settings` reports them. */
type WhatsAppCallingSettings = {
  status?: CallingStatus;
  srtpKeyExchange?: SrtpKeyExchange;
  sip: { status?: CallingStatus; servers: WhatsAppSipServer[] };
};

type InspectWhatsAppNumberParams = { phoneNumberId: string };

type WhatsAppNumberInfo = {
  /** The business number in E.164, from Meta's `display_phone_number`. */
  phoneNumber: string;
  verifiedName?: string;
  /** Meta's literal tier string, for example `TIER_10K`. */
  messagingLimitTier?: string;
  qualityRating?: string;
  calling: WhatsAppCallingSettings;
};

type EnableWhatsAppSipCallingParams = {
  phoneNumberId: string;
  sipServer: WhatsAppSipServer;
  /** Required: the caller pins it. */
  srtpKeyExchange: SrtpKeyExchange;
  /** Sent as `audio.additional_codecs` only when present. Opus stays mandatory on Meta's side. */
  additionalCodecs?: string[];
};

type EnableWhatsAppSipCallingResult = {
  /** The SIP digest username Meta expects: the business number without `+`. */
  sipUsername: string;
  /** The SIP password Meta issued for the number. */
  sipPassword: string;
  phoneNumber: string;
  /** The `calling` object Meta reported before the change, with no password in it. */
  previousSettings: Record<string, unknown>;
};

type DisableWhatsAppSipCallingParams = { phoneNumberId: string };

export {
  CallingStatus,
  DisableWhatsAppSipCallingParams,
  EnableWhatsAppSipCallingParams,
  EnableWhatsAppSipCallingResult,
  InspectWhatsAppNumberParams,
  SrtpKeyExchange,
  WhatsAppCallingSettings,
  WhatsAppLinkOptions,
  WhatsAppNumberInfo,
  WhatsAppSipServer
};
