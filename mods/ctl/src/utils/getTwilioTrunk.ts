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
import { TrunkInstance } from "twilio/lib/rest/trunking/v1/trunk";

async function getTwilioTrunk(
  client: Twilio,
  terminationSipUri: string
): Promise<TrunkInstance> {
  try {
    const trunks = await client.trunking.v1.trunks.list();
    return trunks.filter((trunk) => trunk.domainName === terminationSipUri)[0];
  } catch (error: unknown) {
    throw new Error(
      `Error checking SIP trunk existence: ${(error as Error).message}`
    );
  }
}

export { getTwilioTrunk };
