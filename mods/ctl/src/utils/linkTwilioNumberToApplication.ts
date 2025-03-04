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
import * as Fonoster from "@fonoster/sdk";
import { Transport } from "@fonoster/types";
import phone from "phone";
import { Twilio } from "twilio";
import { TWILIO_PSTN_URI_BASE } from "../constants";
import {
  assignTwilioNumberToTrunk,
  createTwilioTrunk,
  getFonosterNumberByTelUrl,
  getFonosterTrunkByInboundUri,
  getTwilioNumber,
  getTwilioTrunk,
  LinkTwilioNumberToApplicationParams
} from ".";

async function linkTwilioNumberToApplication(
  twilioClient: Twilio,
  fonosterClient: Fonoster.Client,
  params: LinkTwilioNumberToApplicationParams
): Promise<void> {
  const {
    applicationRef,
    accessKeyId,
    aclEntries,
    originationUriBase,
    phoneNumber,
    friendlyName
  } = params;

  const resourceRef = accessKeyId.toLowerCase();

  const twilioNumber = await getTwilioNumber(twilioClient, phoneNumber);

  let twilioTrunk = await getTwilioTrunk(
    twilioClient,
    `${resourceRef}.${TWILIO_PSTN_URI_BASE}`
  );

  const fonosterTrunk = await getFonosterTrunkByInboundUri(
    fonosterClient,
    `${resourceRef}.${originationUriBase}`
  );

  const fonosterNumber = await getFonosterNumberByTelUrl(
    fonosterClient,
    `tel:${phoneNumber}`
  );

  if (!twilioNumber) {
    throw Error(`The number ${phoneNumber} was not found in your account.`);
  }

  if (!twilioTrunk) {
    await createTwilioTrunk(twilioClient, {
      resourceRef,
      aclEntries,
      originationUriBase
    });

    twilioTrunk = await getTwilioTrunk(
      twilioClient,
      `${resourceRef}.${TWILIO_PSTN_URI_BASE}`
    );
  }

  await assignTwilioNumberToTrunk(twilioClient, phoneNumber, twilioTrunk.sid);

  let trunkRef = fonosterTrunk?.ref;

  if (!fonosterTrunk) {
    const trunks = new Fonoster.Trunks(fonosterClient);
    const response = await trunks.createTrunk({
      name: "Twilio Trunk",
      inboundUri: `${resourceRef}.${originationUriBase}`,
      sendRegister: true,
      uris: [
        {
          host: `${resourceRef}.${TWILIO_PSTN_URI_BASE}`,
          port: 5060,
          // TODO: This should be a parameter (e.g., a flag)
          transport: "UDP" as Transport,
          enabled: true,
          weight: 10,
          priority: 10
        }
      ]
    });

    trunkRef = response.ref;
  }

  if (fonosterNumber) {
    const numbers = new Fonoster.Numbers(fonosterClient);
    await numbers.deleteNumber(fonosterNumber.ref);
  }

  const numbers = new Fonoster.Numbers(fonosterClient);
  const phoneInfo = phone(phoneNumber);

  await numbers.createNumber({
    name: friendlyName ?? phoneNumber,
    telUrl: `tel:${phoneNumber}`,
    appRef: applicationRef,
    trunkRef,
    city: "unknown",
    country: phoneInfo.countryIso3,
    countryIsoCode: phoneInfo.countryIso2
  });
}

export { linkTwilioNumberToApplication };
