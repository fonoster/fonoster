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
import { Twilio } from "twilio";
import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import { runStep } from "./runStep";
import { TwilioLinkError } from "./TwilioLinkError";

async function findTwilioNumber(
  client: Twilio,
  phoneNumber: string
): Promise<IncomingPhoneNumberInstance> {
  const [number] = await runStep("incomingPhoneNumbers.list", () =>
    client.incomingPhoneNumbers.list({ phoneNumber, limit: 1 })
  );

  if (!number) {
    throw new TwilioLinkError(
      "NUMBER_NOT_FOUND",
      `The number ${phoneNumber} is not in this Twilio account`,
      "incomingPhoneNumbers.list"
    );
  }

  return number;
}

export { findTwilioNumber };
