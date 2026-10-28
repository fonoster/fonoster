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
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { TwilioCredentials } from "@fonoster/types";
import {
  assignTwilioNumberToTrunk,
  provisionTwilioTrunk,
  removeOtherTwilioSipCredentials,
  TwilioLinkError
} from "../../src/twilio";
import {
  Account,
  createTwilioFake,
  PERMISSIONS,
  TwilioFake
} from "./createTwilioFake";
import { twilioFakeHttpClient } from "./twilioFakeHttpClient";

chai.use(chaiAsPromised);

const ACCOUNT_SID = "AC00000000000000000000000000000001";
const OTHER_ACCOUNT_SID = "AC00000000000000000000000000000002";
const AUTH_TOKEN = "auth-token-0001";
const STANDARD_KEY = {
  sid: "SK00000000000000000000000000000001",
  secret: "standard-secret"
};
const RESTRICTED_KEY = {
  sid: "SK00000000000000000000000000000002",
  secret: "restricted-secret"
};
const NO_TRUNK_KEY = {
  sid: "SK00000000000000000000000000000003",
  secret: "no-trunk-secret"
};
const NUMBER = "+18095550123";
const VOICE_URL = "https://demo.twilio.com/welcome/voice/";
const LABEL = "wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3";

const authToken: TwilioCredentials = {
  accountSid: ACCOUNT_SID,
  authToken: AUTH_TOKEN
};
const keyCredentials = (key: {
  sid: string;
  secret: string;
}): TwilioCredentials => ({
  accountSid: ACCOUNT_SID,
  apiKeySid: key.sid,
  apiKeySecret: key.secret
});

const params = (
  sipCredential = {
    username: "fonoster-3f9a1c2b",
    password: "Vq7kR2mXp9LtW4zA"
  }
) => ({
  phoneNumber: NUMBER,
  label: LABEL,
  originationUri: `sip:${LABEL}.pstn.fonoster.com`,
  aclEntries: ["203.0.113.10/32"],
  sipCredential
});

/** Links the number the way a caller does: provision, then move the number last. */
async function link(
  fake: TwilioFake,
  credentials: TwilioCredentials,
  sipCredential?: { username: string; password: string }
) {
  const httpClient = twilioFakeHttpClient(fake);
  const result = await provisionTwilioTrunk(
    credentials,
    params(sipCredential),
    { httpClient }
  );
  await assignTwilioNumberToTrunk(
    credentials,
    { phoneNumber: NUMBER, twilioTrunkSid: result.twilioTrunkSid },
    { httpClient }
  );
  return result;
}

function expectOneCompleteLink(account: Account, usernames: string[]) {
  expect(account.trunks).to.have.length(1);
  const [trunk] = account.trunks;
  expect(trunk.friendlyName).to.equal(`Trunk-${LABEL}`);
  expect(trunk.domainName).to.equal(`${LABEL}.pstn.twilio.com`);
  expect(account.numbers[0].trunkSid).to.equal(trunk.sid);

  expect(account.acls).to.have.length(1);
  expect(trunk.aclSids).to.deep.equal([account.acls[0].sid]);
  expect(
    account.acls[0].ipAddresses.map(
      (ip) => `${ip.ipAddress}/${ip.cidrPrefixLength}`
    )
  ).to.deep.equal(["203.0.113.10/32"]);

  expect(trunk.originationUrls).to.have.length(1);
  expect(trunk.originationUrls[0]).to.include({
    sipUrl: `sip:${LABEL}.pstn.fonoster.com`,
    priority: 10,
    weight: 10
  });

  expect(account.credentialLists).to.have.length(1);
  expect(trunk.credentialListSids).to.deep.equal([
    account.credentialLists[0].sid
  ]);
  expect(
    account.credentialLists[0].credentials.map((c) => c.username)
  ).to.deep.equal(usernames);
}

async function expectLinkError(
  promise: Promise<unknown>,
  reason: string,
  step?: string
): Promise<TwilioLinkError> {
  const error = await promise.then(
    () => expect.fail("expected a TwilioLinkError"),
    (e: unknown) => e
  );
  expect(error).to.be.instanceOf(TwilioLinkError);
  expect((error as TwilioLinkError).reason).to.equal(reason);
  if (step) expect((error as TwilioLinkError).step).to.equal(step);
  return error as TwilioLinkError;
}

describe("@common[twilio/provisionTwilioTrunk]", function () {
  let fake: TwilioFake;
  let account: Account;

  beforeEach(function () {
    fake = createTwilioFake();
    account = fake.addAccount({
      sid: ACCOUNT_SID,
      authToken: AUTH_TOKEN,
      numbers: [{ phoneNumber: NUMBER, voiceUrl: VOICE_URL }],
      keys: [
        STANDARD_KEY,
        {
          ...RESTRICTED_KEY,
          permissions: [
            ...PERMISSIONS.numbers,
            ...PERMISSIONS.ipAcls,
            ...PERMISSIONS.credentialLists,
            ...PERMISSIONS.trunks
          ]
        },
        {
          ...NO_TRUNK_KEY,
          permissions: [
            ...PERMISSIONS.numbers,
            ...PERMISSIONS.ipAcls,
            ...PERMISSIONS.credentialLists
          ]
        }
      ]
    });
  });

  it("links the number with an Auth Token", async function () {
    // Act
    const result = await link(fake, authToken);

    // Assert
    expect(result).to.deep.equal({
      twilioTrunkSid: account.trunks[0].sid,
      terminationHost: `${LABEL}.pstn.twilio.com`
    });
    expectOneCompleteLink(account, ["fonoster-3f9a1c2b"]);
  });

  it("links the number with a Standard API key", async function () {
    // Act
    await link(fake, keyCredentials(STANDARD_KEY));

    // Assert
    expectOneCompleteLink(account, ["fonoster-3f9a1c2b"]);
  });

  it("refuses a Restricted key at the step the recording shows (the trunk's IP ACL)", async function () {
    // Act
    const promise = link(fake, keyCredentials(RESTRICTED_KEY));

    // Assert
    await expectLinkError(
      promise,
      "PERMISSION_MISSING",
      "trunking.trunks.ipAccessControlLists.list"
    );
  });

  it("leaves the number untouched until assignTwilioNumberToTrunk runs", async function () {
    // Act
    await provisionTwilioTrunk(authToken, params(), {
      httpClient: twilioFakeHttpClient(fake)
    });

    // Assert
    expect(account.numbers[0]).to.include({
      trunkSid: null,
      voiceUrl: VOICE_URL
    });
  });

  it("throws DOMAIN_TAKEN and creates no ACL when another account owns the domain", async function () {
    // Arrange
    const other = fake.addAccount({
      sid: OTHER_ACCOUNT_SID,
      authToken: "other-token"
    });
    other.trunks.push({
      sid: "TK00000000000000000000000000000009",
      friendlyName: `Trunk-${LABEL}`,
      domainName: `${LABEL}.pstn.twilio.com`,
      aclSids: [],
      credentialListSids: [],
      originationUrls: []
    });

    // Act
    const promise = link(fake, authToken);

    // Assert
    await expectLinkError(promise, "DOMAIN_TAKEN", "trunking.trunks.create");
    expect(account.trunks).to.be.empty;
    expect(account.acls).to.be.empty;
  });

  it("converges on a re-run with a new SIP credential, and removes the old one on request", async function () {
    // Arrange
    await link(fake, authToken);

    // Act
    await link(fake, authToken, {
      username: "fonoster-77aa0b1c",
      password: "Kd8sLq2Wm5Zt9RxP"
    });

    // Assert
    expectOneCompleteLink(account, ["fonoster-3f9a1c2b", "fonoster-77aa0b1c"]);

    // Act
    await removeOtherTwilioSipCredentials(
      authToken,
      { label: LABEL, keepUsername: "fonoster-77aa0b1c" },
      { httpClient: twilioFakeHttpClient(fake) }
    );

    // Assert
    expectOneCompleteLink(account, ["fonoster-77aa0b1c"]);
  });

  it("adds a credential list to a trunk the old CLI made, without a second trunk or ACL", async function () {
    // Arrange: what today's CLI leaves (baseline step a/old): trunk, ACL, origination URL, number
    account.acls.push({
      sid: "AL00000000000000000000000000000001",
      friendlyName: `ACL-${LABEL}`,
      ipAddresses: [
        {
          sid: "IP00000000000000000000000000000001",
          friendlyName: `${LABEL}-entry-203.0.113.10`,
          ipAddress: "203.0.113.10",
          cidrPrefixLength: 32
        }
      ]
    });
    account.trunks.push({
      sid: "TK00000000000000000000000000000001",
      friendlyName: `Trunk-${LABEL}`,
      domainName: `${LABEL}.pstn.twilio.com`,
      aclSids: ["AL00000000000000000000000000000001"],
      credentialListSids: [],
      originationUrls: [
        {
          sid: "OU00000000000000000000000000000001",
          friendlyName: `Origination-${LABEL}`,
          sipUrl: `sip:${LABEL}.pstn.fonoster.com`,
          priority: 10,
          weight: 10,
          enabled: true
        }
      ]
    });
    account.numbers[0].trunkSid = "TK00000000000000000000000000000001";

    // Act
    const result = await link(fake, authToken);

    // Assert
    expect(result.twilioTrunkSid).to.equal(
      "TK00000000000000000000000000000001"
    );
    expectOneCompleteLink(account, ["fonoster-3f9a1c2b"]);
  });

  it("leaves one ACL and one trunk when a refused trunk create is retried with a permitted key", async function () {
    // Arrange
    await expectLinkError(
      link(fake, keyCredentials(NO_TRUNK_KEY)),
      "PERMISSION_MISSING",
      "trunking.trunks.list"
    );

    // Act
    await link(fake, keyCredentials(STANDARD_KEY));

    // Assert
    expectOneCompleteLink(account, ["fonoster-3f9a1c2b"]);
  });

  it("throws NUMBER_NOT_FOUND and creates nothing for a number not in the account", async function () {
    // Arrange
    account.numbers = [];

    // Act
    const promise = link(fake, authToken);

    // Assert
    await expectLinkError(
      promise,
      "NUMBER_NOT_FOUND",
      "incomingPhoneNumbers.list"
    );
    expect(account.trunks).to.be.empty;
    expect(account.acls).to.be.empty;
    expect(account.credentialLists).to.be.empty;
  });

  it("throws CREDENTIALS_REFUSED for a wrong secret", async function () {
    // Act
    const promise = link(fake, { accountSid: ACCOUNT_SID, authToken: "wrong" });

    // Assert
    await expectLinkError(
      promise,
      "CREDENTIALS_REFUSED",
      "incomingPhoneNumbers.list"
    );
  });

  it("throws PERMISSION_MISSING naming the call for a key without trunking permission", async function () {
    // Act
    const promise = link(fake, keyCredentials(NO_TRUNK_KEY));

    // Assert
    const error = await expectLinkError(
      promise,
      "PERMISSION_MISSING",
      "trunking.trunks.list"
    );
    expect(error.message).to.include("70051");
  });

  it("throws INVALID_CREDENTIALS and sends nothing for an empty token or a missing secret", async function () {
    // Act
    const empty = link(fake, { accountSid: ACCOUNT_SID, authToken: "" });
    const missing = link(fake, {
      accountSid: ACCOUNT_SID,
      apiKeySid: STANDARD_KEY.sid
    } as unknown as TwilioCredentials);

    // Assert
    await expectLinkError(empty, "INVALID_CREDENTIALS");
    await expectLinkError(missing, "INVALID_CREDENTIALS");
    expect(fake.requests).to.be.empty;
  });

  it("keeps the Authorization header, SID and secret out of the message when Twilio is unreachable", async function () {
    // Arrange
    fake.setUnreachable(true);

    // Act
    const error = await expectLinkError(
      link(fake, keyCredentials(STANDARD_KEY)),
      "UNAVAILABLE",
      "incomingPhoneNumbers.list"
    );

    // Assert
    const text = `${error.message} ${JSON.stringify(error)}`;
    expect(text).to.not.include("Authorization");
    expect(text).to.not.include(STANDARD_KEY.sid);
    expect(text).to.not.include(STANDARD_KEY.secret);
    expect(text).to.not.include(ACCOUNT_SID);
  });

  it("throws a plain error before any request for an ACL entry that isn't IPv4", async function () {
    // Act
    const promise = provisionTwilioTrunk(
      authToken,
      { ...params(), aclEntries: ["2001:db8::1"] },
      { httpClient: twilioFakeHttpClient(fake) }
    );

    // Assert
    await expect(promise).to.be.rejectedWith(
      "aclEntries must be IPv4 addresses"
    );
    expect(fake.requests).to.be.empty;
  });

  it("finds the trunk past the first page of trunks", async function () {
    // Arrange
    for (let i = 0; i < 60; i++) {
      account.trunks.push({
        sid: `TK${String(i).padStart(32, "0")}`,
        friendlyName: `Trunk-other-${i}`,
        domainName: `other-${i}.pstn.twilio.com`,
        aclSids: [],
        credentialListSids: [],
        originationUrls: []
      });
    }
    await link(fake, authToken);

    // Act
    await link(fake, authToken);

    // Assert
    expect(
      account.trunks.filter((t) => t.domainName.startsWith(LABEL))
    ).to.have.length(1);
  });
});
