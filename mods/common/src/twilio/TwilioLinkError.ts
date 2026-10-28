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
type TwilioLinkErrorReason =
  | "INVALID_CREDENTIALS"
  | "CREDENTIALS_REFUSED"
  | "PERMISSION_MISSING"
  | "NUMBER_NOT_FOUND"
  | "DOMAIN_TAKEN"
  | "UNAVAILABLE";

/**
 * A failed step of the Twilio side of a number link. `step` names the Twilio call that failed
 * (for example `trunking.trunks.create`); `message` carries only Twilio's status, code and
 * message, never the request, its headers or the credentials.
 */
class TwilioLinkError extends Error {
  readonly reason: TwilioLinkErrorReason;
  readonly step?: string;

  constructor(reason: TwilioLinkErrorReason, message: string, step?: string) {
    super(message);
    this.name = "TwilioLinkError";
    this.reason = reason;
    this.step = step;
  }
}

export { TwilioLinkError, TwilioLinkErrorReason };
