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
import { WhatsAppCredentials } from "@fonoster/types";
import {
  disableWhatsAppSipCalling,
  enableWhatsAppSipCalling,
  inspectWhatsAppNumber,
  WhatsAppLinkError
} from "../../src/whatsapp";
import {
  createGraphApiFake,
  FakePhoneNumber,
  GraphApiFake
} from "./createGraphApiFake";
import { graphApiFakeFetch } from "./graphApiFakeFetch";

chai.use(chaiAsPromised);

const PHONE_NUMBER_ID = "104857329146382";
const OTHER_PHONE_NUMBER_ID = "118422907365511";
const WABA_ID = "102938475610293";
const OTHER_WABA_ID = "119283746501928";
const PHONE_NUMBER = "+525512345678";
const LABEL = "wo7d2kq9x4m1c8b3n6p0r5t2v9y4z7a1e3";
const SIP_SERVER = {
  hostname: `wa-${LABEL}-525512345678.pstn.fonoster.ai`,
  port: 5061
};
const PROTOTYPE_SERVER = { hostname: "sip.acme-prototype.example", port: 5061 };

const FULL_TOKEN = "EAAfull0000000000000000000000000";
const MANAGEMENT_TOKEN = "EAAmanagement000000000000000000";
const MESSAGING_TOKEN = "EAAmessaging0000000000000000000";
const WRONG_TOKEN = "EAAwrong00000000000000000000000";

const credentials = (accessToken: string): WhatsAppCredentials => ({
  accessToken
});

function phoneNumber(
  overrides: Partial<FakePhoneNumber> = {}
): FakePhoneNumber {
  return {
    id: PHONE_NUMBER_ID,
    wabaId: WABA_ID,
    displayPhoneNumber: "+52 55 1234 5678",
    verifiedName: "Acme MX",
    messagingLimitTier: "TIER_10K",
    qualityRating: "GREEN",
    calling: {
      status: "ENABLED",
      srtpKeyExchange: "DTLS",
      sip: { status: "ENABLED", servers: [PROTOTYPE_SERVER] }
    },
    sipPassword: "prototype-password",
    ...overrides
  };
}

function fakeFor(
  numbers: FakePhoneNumber[] = [phoneNumber()],
  options?: Partial<GraphApiFake["options"]>
): GraphApiFake {
  return createGraphApiFake({
    phoneNumbers: numbers,
    tokens: [
      {
        token: FULL_TOKEN,
        permissions: [
          "whatsapp_business_management",
          "whatsapp_business_messaging"
        ],
        wabaIds: [WABA_ID]
      },
      {
        token: MANAGEMENT_TOKEN,
        permissions: ["whatsapp_business_management"],
        wabaIds: [WABA_ID]
      },
      {
        token: MESSAGING_TOKEN,
        permissions: ["whatsapp_business_messaging"],
        wabaIds: [WABA_ID]
      }
    ],
    options
  });
}

const enable = (
  fake: GraphApiFake,
  token = FULL_TOKEN,
  params: Partial<Parameters<typeof enableWhatsAppSipCalling>[1]> = {}
) =>
  enableWhatsAppSipCalling(
    credentials(token),
    {
      phoneNumberId: PHONE_NUMBER_ID,
      sipServer: SIP_SERVER,
      srtpKeyExchange: "SDES",
      ...params
    },
    { fetch: graphApiFakeFetch(fake) }
  );

async function expectLinkError(
  promise: Promise<unknown>,
  reason: string,
  step?: string
): Promise<WhatsAppLinkError> {
  const error = await promise.then(
    () => {
      throw new Error(`expected ${reason}, but it resolved`);
    },
    (e: unknown) => e
  );
  expect(error).to.be.instanceOf(WhatsAppLinkError);
  expect((error as WhatsAppLinkError).reason).to.equal(reason);
  if (step) expect((error as WhatsAppLinkError).step).to.equal(step);
  return error as WhatsAppLinkError;
}

function expectUnchanged(fake: GraphApiFake) {
  expect(fake.phoneNumbers[PHONE_NUMBER_ID].calling).to.deep.equal(
    phoneNumber().calling
  );
  expect(fake.phoneNumbers[PHONE_NUMBER_ID].sipPassword).to.equal(
    "prototype-password"
  );
}

describe("@common[whatsapp/enableWhatsAppSipCalling]", function () {
  for (const [name, token] of [
    ["a token with both permissions", FULL_TOKEN],
    ["a token with whatsapp_business_management only", MANAGEMENT_TOKEN]
  ] as const) {
    it(`enables SIP calling with ${name}`, async function () {
      const fake = fakeFor();

      const result = await enable(fake, token);

      const { calling, sipPassword } = fake.phoneNumbers[PHONE_NUMBER_ID];
      expect(calling.status).to.equal("ENABLED");
      expect(calling.sip.status).to.equal("ENABLED");
      expect(calling.srtpKeyExchange).to.equal("SDES");
      expect(calling.sip.webhookDelivery).to.equal("DISABLED");
      expect(calling.sip.servers).to.deep.equal([SIP_SERVER]);
      expect(result.sipPassword).to.equal(sipPassword);
      expect(result.sipUsername).to.equal("525512345678");
      expect(result.phoneNumber).to.equal(PHONE_NUMBER);
      expect(result.previousSettings).to.deep.equal({
        status: "ENABLED",
        srtp_key_exchange_protocol: "DTLS",
        sip: { status: "ENABLED", servers: [PROTOTYPE_SERVER] }
      });
      expect(JSON.stringify(result.previousSettings)).to.not.contain(
        "prototype-password"
      );
    });
  }

  it("converges on a second call with identical values", async function () {
    const fake = fakeFor();

    const first = await enable(fake);
    const second = await enable(fake);

    const { calling } = fake.phoneNumbers[PHONE_NUMBER_ID];
    expect(calling.sip.servers).to.deep.equal([SIP_SERVER]);
    // PROVISIONAL: the baseline record's step c decides whether Meta keeps the password on a
    // re-post; the fake keeps it until the record says otherwise
    expect(second.sipPassword).to.equal(first.sipPassword);
    expect(second.previousSettings).to.deep.equal({
      status: "ENABLED",
      srtp_key_exchange_protocol: "SDES",
      sip: {
        status: "ENABLED",
        webhook_delivery: "DISABLED",
        servers: [SIP_SERVER]
      }
    });
  });

  it("calls only the phone number and its settings, with the token in the header", async function () {
    const fake = fakeFor();

    await enable(fake);

    const paths = new Set(fake.requests.map((r) => `${r.method} ${r.path}`));
    expect([...paths].sort()).to.deep.equal([
      `GET /v23.0/${PHONE_NUMBER_ID}`,
      `GET /v23.0/${PHONE_NUMBER_ID}/settings`,
      `POST /v23.0/${PHONE_NUMBER_ID}/settings`
    ]);
    for (const request of fake.requests) {
      expect(request.query).to.not.have.property("access_token");
    }
  });

  it("throws PERMISSION_MISSING for a token with whatsapp_business_messaging only", async function () {
    const fake = fakeFor();

    await expectLinkError(
      enable(fake, MESSAGING_TOKEN),
      "PERMISSION_MISSING",
      "settings.get"
    );
    expectUnchanged(fake);
  });

  it("throws TOKEN_REFUSED on the first call for a wrong token", async function () {
    const fake = fakeFor();

    await expectLinkError(
      enable(fake, WRONG_TOKEN),
      "TOKEN_REFUSED",
      "phoneNumbers.get"
    );
    expect(fake.requests).to.have.length(1);
    expectUnchanged(fake);
  });

  it("throws NUMBER_NOT_FOUND for a phone number id the token can't reach", async function () {
    const fake = fakeFor([
      phoneNumber(),
      phoneNumber({ id: OTHER_PHONE_NUMBER_ID, wabaId: OTHER_WABA_ID })
    ]);

    await expectLinkError(
      enable(fake, FULL_TOKEN, { phoneNumberId: OTHER_PHONE_NUMBER_ID }),
      "NUMBER_NOT_FOUND",
      "phoneNumbers.get"
    );
    expect(fake.phoneNumbers[OTHER_PHONE_NUMBER_ID].calling).to.deep.equal(
      phoneNumber().calling
    );
  });

  it("throws TIER_TOO_LOW before any POST for a number on TIER_1K", async function () {
    const fake = fakeFor([phoneNumber({ messagingLimitTier: "TIER_1K" })]);

    await expectLinkError(enable(fake), "TIER_TOO_LOW");
    expect(fake.requests.map((r) => r.method)).to.not.include("POST");
  });

  for (const [name, token, id] of [
    ["an empty token", "", PHONE_NUMBER_ID],
    ["a token with a line break", "EAAbad\r\ntoken", PHONE_NUMBER_ID],
    ["a phone number id with letters", FULL_TOKEN, "abc"]
  ] as const) {
    it(`throws INVALID_CREDENTIALS and sends nothing for ${name}`, async function () {
      const fake = fakeFor();

      await expectLinkError(
        enable(fake, token, { phoneNumberId: id }),
        "INVALID_CREDENTIALS"
      );
      expect(fake.requests).to.be.empty;
    });
  }

  for (const mode of ["5xx", "network"] as const) {
    it(`throws UNAVAILABLE without the token when Meta fails (${mode})`, async function () {
      const fake = fakeFor();
      fake.fail(mode);

      const error = await expectLinkError(enable(fake), "UNAVAILABLE");
      expect(error.message).to.not.contain(FULL_TOKEN);
      expect(error.message).to.not.contain("Authorization");
      expect(error.message).to.not.contain("Bearer");
    });
  }

  it("throws SIP_SERVER_REJECTED when Meta refuses the SIP server", async function () {
    // PROVISIONAL: step i of the baseline decides whether Meta rejects an IP literal; if it
    // accepts every server, this case and the reason go away (#1191 Constraints)
    const fake = fakeFor();

    await expectLinkError(
      enable(fake, FULL_TOKEN, {
        sipServer: { hostname: "203.0.113.10", port: 5061 }
      }),
      "SIP_SERVER_REJECTED",
      "settings.post"
    );
    expectUnchanged(fake);
  });

  it("disables SIP calling and clears the servers", async function () {
    const fake = fakeFor();

    await disableWhatsAppSipCalling(
      credentials(FULL_TOKEN),
      { phoneNumberId: PHONE_NUMBER_ID },
      { fetch: graphApiFakeFetch(fake) }
    );

    const { calling } = fake.phoneNumbers[PHONE_NUMBER_ID];
    expect(calling.sip.status).to.equal("DISABLED");
    expect(calling.sip.servers).to.deep.equal([]);
  });

  it("inspects the number: E.164, tier and current calling settings", async function () {
    const fake = fakeFor();

    const info = await inspectWhatsAppNumber(
      credentials(FULL_TOKEN),
      { phoneNumberId: PHONE_NUMBER_ID },
      { fetch: graphApiFakeFetch(fake) }
    );

    expect(info).to.deep.equal({
      phoneNumber: PHONE_NUMBER,
      verifiedName: "Acme MX",
      messagingLimitTier: "TIER_10K",
      qualityRating: "GREEN",
      calling: {
        status: "ENABLED",
        srtpKeyExchange: "DTLS",
        sip: { status: "ENABLED", servers: [PROTOTYPE_SERVER] }
      }
    });
  });
});
