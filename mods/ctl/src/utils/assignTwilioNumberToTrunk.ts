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

async function assignTwilioNumberToTrunk(
  client: Twilio,
  phoneNumber: string,
  trunkSid: string
): Promise<void> {
  try {
    const numbers = await client.incomingPhoneNumbers.list({
      phoneNumber,
      limit: 1
    });

    if (numbers.length === 0) {
      throw new Error(
        `Phone number ${phoneNumber} not found in your Twilio account.`
      );
    }

    const numberSid = numbers[0].sid;

    // Step 2: Update the Voice URL of the number to point to the trunk's domain URI
    await client.incomingPhoneNumbers(numberSid).update({
      trunkSid
    });
  } catch (error: unknown) {
    throw new Error(
      `Failed to assign phone number to trunk: ${(error as Error).message}`
    );
  }
}

export { assignTwilioNumberToTrunk };
