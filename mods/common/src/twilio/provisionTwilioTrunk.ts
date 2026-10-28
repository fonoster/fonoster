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
import net from "node:net";
import { getLogger } from "@fonoster/logger";
import { TwilioCredentials } from "@fonoster/types";
import { Twilio } from "twilio";
import { createTwilioClient } from "./createTwilioClient";
import { findTwilioNumber } from "./findTwilioNumber";
import { runStep } from "./runStep";
import {
  ProvisionTwilioTrunkParams,
  ProvisionTwilioTrunkResult,
  TwilioLinkOptions
} from "./types";

const logger = getLogger({ service: "common", filePath: __filename });

const TWILIO_PSTN_URI_BASE = "pstn.twilio.com";

type AclEntry = { ipAddress: string; cidrPrefixLength: number };

function parseAclEntries(aclEntries: string[]): AclEntry[] {
  return aclEntries.map((entry) => {
    const [ipAddress, prefix, ...rest] = entry.split("/");
    const cidrPrefixLength = prefix === undefined ? 32 : Number(prefix);

    if (
      rest.length > 0 ||
      !net.isIPv4(ipAddress) ||
      !/^\d{1,2}$/.test(prefix ?? "32") ||
      cidrPrefixLength > 32
    ) {
      throw new Error("aclEntries must be IPv4 addresses");
    }

    return { ipAddress, cidrPrefixLength };
  });
}

/**
 * Sets up the Twilio side of a number link: the trunk `Trunk-<label>` on
 * `<label>.pstn.twilio.com`, the IP ACL `ACL-<label>`, the origination URL and the credential
 * list `CL-<label>`. Every step finds its resource before creating it, so a re-run converges.
 * It checks that the number is in the account but does not move it (assignTwilioNumberToTrunk).
 */
async function provisionTwilioTrunk(
  credentials: TwilioCredentials,
  params: ProvisionTwilioTrunkParams,
  options: TwilioLinkOptions = {}
): Promise<ProvisionTwilioTrunkResult> {
  const client = createTwilioClient(credentials, options);
  const { phoneNumber, label, originationUri, sipCredential } = params;
  const aclEntries = parseAclEntries(params.aclEntries);
  const domainName = `${label}.${TWILIO_PSTN_URI_BASE}`;

  logger.verbose("provisioning the Twilio trunk", { label, phoneNumber });

  await findTwilioNumber(client, phoneNumber);

  // The trunk comes first so that a taken domain leaves nothing behind
  const trunk = await findOrCreateTrunk(client, label, domainName);

  const aclSid = await findOrCreateAcl(client, label, aclEntries);

  const attachedAcls = await runStep(
    "trunking.trunks.ipAccessControlLists.list",
    () => client.trunking.v1.trunks(trunk).ipAccessControlLists.list()
  );

  if (!attachedAcls.some((acl) => acl.sid === aclSid)) {
    await runStep("trunking.trunks.ipAccessControlLists.create", () =>
      client.trunking.v1
        .trunks(trunk)
        .ipAccessControlLists.create({ ipAccessControlListSid: aclSid })
    );
  }

  const originationUrls = await runStep(
    "trunking.trunks.originationUrls.list",
    () => client.trunking.v1.trunks(trunk).originationUrls.list()
  );

  if (!originationUrls.some((url) => url.sipUrl === originationUri)) {
    await runStep("trunking.trunks.originationUrls.create", () =>
      client.trunking.v1.trunks(trunk).originationUrls.create({
        friendlyName: `Origination-${label}`,
        sipUrl: originationUri,
        priority: 10,
        weight: 10,
        enabled: true
      })
    );
  }

  const credentialListSid = await findOrCreateCredentialList(
    client,
    label,
    sipCredential
  );

  const attachedLists = await runStep(
    "trunking.trunks.credentialsLists.list",
    () => client.trunking.v1.trunks(trunk).credentialsLists.list()
  );

  if (!attachedLists.some((list) => list.sid === credentialListSid)) {
    await runStep("trunking.trunks.credentialsLists.create", () =>
      client.trunking.v1
        .trunks(trunk)
        .credentialsLists.create({ credentialListSid })
    );
  }

  logger.verbose("provisioned the Twilio trunk", {
    label,
    twilioTrunkSid: trunk
  });

  return { twilioTrunkSid: trunk, terminationHost: domainName };
}

async function findOrCreateTrunk(
  client: Twilio,
  label: string,
  domainName: string
): Promise<string> {
  const trunks = await runStep("trunking.trunks.list", () =>
    client.trunking.v1.trunks.list()
  );

  const existing = trunks.find((trunk) => trunk.domainName === domainName);

  if (existing) {
    return existing.sid;
  }

  const created = await runStep("trunking.trunks.create", () =>
    client.trunking.v1.trunks.create({
      friendlyName: `Trunk-${label}`,
      domainName
    })
  );

  return created.sid;
}

async function findOrCreateAcl(
  client: Twilio,
  label: string,
  aclEntries: AclEntry[]
): Promise<string> {
  const acls = await runStep("sip.ipAccessControlLists.list", () =>
    client.sip.ipAccessControlLists.list()
  );

  const aclSid =
    acls.find((acl) => acl.friendlyName === `ACL-${label}`)?.sid ??
    (
      await runStep("sip.ipAccessControlLists.create", () =>
        client.sip.ipAccessControlLists.create({ friendlyName: `ACL-${label}` })
      )
    ).sid;

  const addresses = await runStep(
    "sip.ipAccessControlLists.ipAddresses.list",
    () => client.sip.ipAccessControlLists(aclSid).ipAddresses.list()
  );

  const same = (a: AclEntry, b: AclEntry) =>
    a.ipAddress === b.ipAddress && a.cidrPrefixLength === b.cidrPrefixLength;

  for (const entry of aclEntries) {
    if (!addresses.some((address) => same(address, entry))) {
      await runStep("sip.ipAccessControlLists.ipAddresses.create", () =>
        client.sip.ipAccessControlLists(aclSid).ipAddresses.create({
          friendlyName: `${label}-${entry.ipAddress}-${entry.cidrPrefixLength}`,
          ...entry
        })
      );
    }
  }

  for (const address of addresses) {
    if (!aclEntries.some((entry) => same(address, entry))) {
      await runStep("sip.ipAccessControlLists.ipAddresses.remove", () =>
        client.sip
          .ipAccessControlLists(aclSid)
          .ipAddresses(address.sid)
          .remove()
      );
    }
  }

  return aclSid;
}

async function findOrCreateCredentialList(
  client: Twilio,
  label: string,
  sipCredential: { username: string; password: string }
): Promise<string> {
  const lists = await runStep("sip.credentialLists.list", () =>
    client.sip.credentialLists.list()
  );

  const listSid =
    lists.find((list) => list.friendlyName === `CL-${label}`)?.sid ??
    (
      await runStep("sip.credentialLists.create", () =>
        client.sip.credentialLists.create({ friendlyName: `CL-${label}` })
      )
    ).sid;

  const credentials = await runStep(
    "sip.credentialLists.credentials.list",
    () => client.sip.credentialLists(listSid).credentials.list()
  );

  const existing = credentials.find(
    (credential) => credential.username === sipCredential.username
  );

  if (existing) {
    await runStep("sip.credentialLists.credentials.update", () =>
      client.sip
        .credentialLists(listSid)
        .credentials(existing.sid)
        .update({ password: sipCredential.password })
    );
  } else {
    await runStep("sip.credentialLists.credentials.create", () =>
      client.sip.credentialLists(listSid).credentials.create(sipCredential)
    );
  }

  return listSid;
}

export { provisionTwilioTrunk };
