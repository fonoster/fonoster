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
import { TWILIO_PSTN_URI_BASE } from "../constants";
import { TwilioTrunkParams } from ".";

async function createTwilioTrunk(
  client: Twilio,
  params: TwilioTrunkParams
): Promise<void> {
  const { resourceRef, originationUriBase, aclEntries } = params;

  try {
    const aclName = `ACL-${resourceRef}`;
    const trunkName = `Trunk-${resourceRef}`;
    const domainName = `${resourceRef}.${TWILIO_PSTN_URI_BASE}`;
    const originationUri = `sip:${resourceRef}.${originationUriBase}`;

    // Create ACLresource and entries
    const acl = await client.sip.ipAccessControlLists.create({
      friendlyName: aclName
    });

    for (const ip of aclEntries) {
      await client.sip.ipAccessControlLists(acl.sid).ipAddresses.create({
        friendlyName: `${resourceRef}-entry-${ip}`,
        ipAddress: ip
      });
    }

    // Create the trunk
    const trunk = await client.trunking.v1.trunks.create({
      friendlyName: trunkName,
      domainName: domainName
    });

    // Add the ACL to the trunk
    await client.trunking.v1.trunks(trunk.sid).ipAccessControlLists.create({
      ipAccessControlListSid: acl.sid
    });

    // Create origination URL
    await client.trunking.v1.trunks(trunk.sid).originationUrls.create({
      friendlyName: `Origination-${resourceRef}`,
      sipUrl: originationUri,
      priority: 10,
      weight: 10,
      enabled: true
    });
  } catch (error: unknown) {
    throw new Error(`Failed to create resources: ${(error as Error).message}`);
  }
}

export { createTwilioTrunk };
