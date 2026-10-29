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
type WhatsAppLinkErrorReason =
  | "INVALID_CREDENTIALS"
  | "TOKEN_REFUSED"
  | "PERMISSION_MISSING"
  | "NUMBER_NOT_FOUND"
  | "TIER_TOO_LOW"
  | "SIP_SERVER_REJECTED"
  | "UNAVAILABLE";

/**
 * A failed step of the Meta side of a WhatsApp number link. `step` names the Graph API call that
 * failed (`phoneNumbers.get`, `settings.get`, `settings.post` or `settings.getCredentials`);
 * `message` carries only Graph's code, subcode and message, never the token, the request, its
 * headers or `fbtrace_id`.
 */
class WhatsAppLinkError extends Error {
  readonly reason: WhatsAppLinkErrorReason;
  readonly step?: string;

  constructor(reason: WhatsAppLinkErrorReason, message: string, step?: string) {
    super(message);
    this.name = "WhatsAppLinkError";
    this.reason = reason;
    this.step = step;
  }
}

export { WhatsAppLinkError, WhatsAppLinkErrorReason };
