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
import { TwilioCredentials } from "@fonoster/types";
import { createTwilioClient } from "./createTwilioClient";
import { findTwilioNumber } from "./findTwilioNumber";
import { runStep } from "./runStep";
import { AssignTwilioNumberToTrunkParams, TwilioLinkOptions } from "./types";

const logger = getLogger({ service: "common", filePath: __filename });

/** Moves the number onto the trunk; the caller runs it last, once the Fonoster side exists. */
async function assignTwilioNumberToTrunk(
  credentials: TwilioCredentials,
  params: AssignTwilioNumberToTrunkParams,
  options: TwilioLinkOptions = {}
): Promise<void> {
  const client = createTwilioClient(credentials, options);
  const { phoneNumber, twilioTrunkSid } = params;

  const number = await findTwilioNumber(client, phoneNumber);

  if (number.trunkSid === twilioTrunkSid) {
    return;
  }

  await runStep("incomingPhoneNumbers.update", () =>
    client.incomingPhoneNumbers(number.sid).update({ trunkSid: twilioTrunkSid })
  );

  logger.verbose("assigned the Twilio number to the trunk", {
    phoneNumber,
    twilioTrunkSid
  });
}

export { assignTwilioNumberToTrunk };
