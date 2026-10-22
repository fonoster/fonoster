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
import { randomBytes } from "crypto";
import * as Fonoster from "@fonoster/sdk";
import { Transport } from "@fonoster/types";
import phone from "phone";
import { TELNYX_SIP_HOST } from "../constants";
import { TelnyxClient } from "./telnyxClient";
import {
  getFonosterNumberByTelUrl,
  getFonosterTrunkByInboundUri,
  LinkTelnyxNumberToApplicationParams
} from ".";

async function linkTelnyxNumberToApplication(
  telnyxClient: TelnyxClient,
  fonosterClient: Fonoster.Client,
  params: LinkTelnyxNumberToApplicationParams
): Promise<void> {
  const {
    accessKeyId,
    applicationRef,
    friendlyName,
    originationUriBase,
    phoneNumber
  } = params;

  const resourceRef = accessKeyId.toLowerCase();

  const telnyxNumber = await telnyxClient.findPhoneNumber(phoneNumber);

  let telnyxTrunk = (await telnyxClient.listFqdnConnections()).filter(
    (connection) => connection.connection_name === `Trunk-${resourceRef}`
  )[0];

  const fonosterTrunk = await getFonosterTrunkByInboundUri(
    fonosterClient,
    `${resourceRef}.${originationUriBase}`
  );

  const fonosterNumber = await getFonosterNumberByTelUrl(
    fonosterClient,
    `tel:${phoneNumber}`
  );

  if (!telnyxNumber) {
    throw Error(`The number ${phoneNumber} was not found in your account.`);
  }

  let outboundCredentialsRef: string | undefined;

  if (!telnyxTrunk) {
    // The outbound voice profile routes Fonoster's outbound calls. Its name is
    // unique in the Telnyx account, so it carries the workspace's access key
    // id.
    const voiceProfile = await telnyxClient.createOutboundVoiceProfile(
      `OutboundProfile-${resourceRef}`
    );

    // Telnyx user names hold up to 32 characters of letters and numbers.
    const userName = `fonoster${resourceRef.slice(0, 24)}`;
    const password = randomBytes(24).toString("hex");

    telnyxTrunk = await telnyxClient.createFqdnConnection({
      connectionName: `Trunk-${resourceRef}`,
      userName,
      password,
      outboundVoiceProfileId: voiceProfile.id
    });

    // Fonoster signs its outbound calls to Telnyx with the connection's
    // credentials, stored as a workspace Credential.
    const credentials = new Fonoster.Credentials(fonosterClient);
    const credentialsRef = await credentials.createCredentials({
      name: "Telnyx Trunk",
      username: userName,
      password
    });

    outboundCredentialsRef = credentialsRef.ref;

    // The trunk here may have outlived its connection (a manual delete in the
    // portal): point it at the new credentials so its outbound calls
    // authenticate again.
    if (fonosterTrunk) {
      const trunks = new Fonoster.Trunks(fonosterClient);
      await trunks.updateTrunk({
        ref: fonosterTrunk.ref,
        outboundCredentialsRef: credentialsRef.ref
      });
    }
  } else if (!fonosterTrunk) {
    // The Fonoster trunk was deleted (or a first run failed after the
    // connection was created): the original password was returned once, at
    // creation, so rotate it and store the new pair.
    const userName = `fonoster${resourceRef.slice(0, 24)}`;
    const password = randomBytes(24).toString("hex");

    await telnyxClient.rotateConnectionPassword(
      telnyxTrunk.id,
      userName,
      password
    );

    const credentials = new Fonoster.Credentials(fonosterClient);
    const credentialsRef = await credentials.createCredentials({
      name: "Telnyx Trunk",
      username: userName,
      password
    });

    outboundCredentialsRef = credentialsRef.ref;
  }

  // The FQDN is where Telnyx sends the number's calls. One per trunk, made
  // when the trunk is, so a re-run finds it and keeps the trunk's inbound
  // URI. The API returns the FQDN's connection id as a number, so compare
  // strings.
  const fqdnUri = `${resourceRef}.${originationUriBase}`;
  const fqdns = await telnyxClient.listFqdns();

  if (
    !fqdns.some(
      (fqdn) =>
        String(fqdn.connection_id) === telnyxTrunk.id && fqdn.fqdn === fqdnUri
    )
  ) {
    await telnyxClient.createFqdn({
      connectionId: telnyxTrunk.id,
      fqdn: fqdnUri
    });
  }

  await telnyxClient.assignNumberToConnection(telnyxNumber.id, telnyxTrunk.id);

  let trunkRef = fonosterTrunk?.ref;

  if (!fonosterTrunk) {
    const trunks = new Fonoster.Trunks(fonosterClient);
    const response = await trunks.createTrunk({
      name: "Telnyx Trunk",
      inboundUri: fqdnUri,
      sendRegister: false,
      ...(outboundCredentialsRef ? { outboundCredentialsRef } : {}),
      uris: [
        {
          host: TELNYX_SIP_HOST,
          port: 5060,
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
    name: friendlyName?.trim() || phoneNumber,
    telUrl: `tel:${phoneNumber}`,
    appRef: applicationRef,
    trunkRef,
    city: "unknown",
    country: phoneInfo.countryIso3,
    countryIsoCode: phoneInfo.countryIso2
  });
}

export { linkTelnyxNumberToApplication };
