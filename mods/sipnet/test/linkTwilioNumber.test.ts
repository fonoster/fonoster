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
import {
  APP_REF_HEADER,
  GrpcError,
  hasAccess,
  ROUTR_DEFAULT_PEER_AOR,
  TwilioLinkError,
  TwilioLinkErrorReason
} from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { Role } from "@fonoster/types";
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import sinon, { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { TEST_TOKEN } from "./testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

const ACCESS_KEY_ID = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";
const LABEL = ACCESS_KEY_ID.toLowerCase();
const PSTN_ROOT = "pstn.fonoster.local";
const INBOUND_URI = `${LABEL}.${PSTN_ROOT}`;
const PHONE_NUMBER = "+18095550123";
const TEL_URL = `tel:${PHONE_NUMBER}`;
const APP_REF = "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00";
const ACCOUNT_SID = "AC0123456789abcdef0123456789abcdef";
const API_KEY_SID = "SK0123456789abcdef0123456789abcdef";
const API_KEY_SECRET = "s3cr3t-api-key-secret-value";
const TWILIO_TRUNK_SID = "TK0123456789abcdef0123456789abcdef";
const LINK_METHOD = "/fonoster.numbers.v1beta2.Numbers/LinkTwilioNumber";

type Resource = Record<string, unknown> & {
  ref: string;
  extended?: { accessKeyId?: string };
};

// An in-memory Routr resource API: create*, update*, get*, delete* and list* over one store.
function fakeApi(resource: string, seed: Resource[] = []) {
  const store = new Map(seed.map((r) => [r.ref, { ...r }]));
  let next = 0;
  const api = {
    store,
    [`create${resource}`]: sandbox.spy(async (request: Resource) => {
      const ref = `${resource.toLowerCase()}-${++next}`;
      store.set(ref, { ...request, ref });
      return { ref };
    }),
    [`update${resource}`]: sandbox.spy(async (request: Resource) => {
      store.set(request.ref, { ...store.get(request.ref), ...request });
      return { ref: request.ref };
    }),
    [`get${resource}`]: sandbox.spy(async (ref: string) => store.get(ref)),
    [`delete${resource}`]: sandbox.spy(async (ref: string) => {
      store.delete(ref);
    }),
    [`list${resource}${resource.endsWith("s") ? "" : "s"}`]: sandbox.spy(
      async () => ({ items: [...store.values()], nextPageToken: "" })
    )
  };
  return api as typeof api & Record<string, sinon.SinonSpy>;
}

function fakeTwilio() {
  return {
    provisionTwilioTrunk: sandbox.stub().resolves({
      twilioTrunkSid: TWILIO_TRUNK_SID,
      terminationHost: `${LABEL}.pstn.twilio.com`
    }),
    assignTwilioNumberToTrunk: sandbox.stub().resolves(),
    removeOtherTwilioSipCredentials: sandbox.stub().resolves()
  };
}

function makeCall(request: Record<string, unknown> = {}) {
  const metadata = new grpc.Metadata();
  metadata.set("token", TEST_TOKEN);
  metadata.set("accesskeyid", ACCESS_KEY_ID);
  return {
    metadata,
    request: {
      phoneNumber: PHONE_NUMBER,
      name: "Front desk",
      appRef: APP_REF,
      credentials: {
        accountSid: ACCOUNT_SID,
        apiKeySid: API_KEY_SID,
        apiKeySecret: API_KEY_SECRET
      },
      ...request
    }
  };
}

async function setup(
  options: {
    numbers?: Resource[];
    trunks?: Resource[];
    credentials?: Resource[];
    signalingAddresses?: string[];
  } = {}
) {
  const { linkTwilioNumber } = await import("../src/numbers/linkTwilioNumber");
  const numbers = fakeApi("Number", options.numbers);
  const trunks = fakeApi("Trunk", options.trunks);
  const credentials = fakeApi("Credentials", options.credentials);
  const twilio = fakeTwilio();
  const checkNumberPreconditions = sandbox.stub().resolves();
  const checkRefs = sandbox.stub().resolves();
  const routing = {
    engineFor: sandbox.stub().resolves("rebuild"),
    aorFor: sandbox.stub().resolves(ROUTR_DEFAULT_PEER_AOR),
    aorOf: sandbox.stub().returns(ROUTR_DEFAULT_PEER_AOR)
  };

  const link = linkTwilioNumber({
    numbers: numbers as never,
    trunks: trunks as never,
    credentials: credentials as never,
    checkNumberPreconditions,
    routing,
    checkRefs,
    pstnRoot: PSTN_ROOT,
    signalingAddresses: options.signalingAddresses ?? [
      "203.0.113.10",
      "198.51.100.0/24",
      "sip.fonoster.local"
    ],
    twilio
  });

  const invoke = async (request: Record<string, unknown> = {}) => {
    const callback = sandbox.stub();
    await link(makeCall(request), callback);
    return callback;
  };

  return {
    numbers,
    trunks,
    credentials,
    twilio,
    checkNumberPreconditions,
    checkRefs,
    invoke
  };
}

const owned = { accessKeyId: ACCESS_KEY_ID };

describe("@sipnet[sipnet/linkTwilioNumber]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("creates the credential, the trunk and the number, and returns both refs", async function () {
    // Arrange
    const { numbers, trunks, credentials, twilio, invoke } = await setup();

    // Act
    const callback = await invoke();

    // Assert
    const [credential] = [...credentials.store.values()];
    const [trunk] = [...trunks.store.values()];
    const [number] = [...numbers.store.values()];

    expect(credential).to.include({ name: `Twilio ${LABEL}` });
    expect(credential.username).to.match(/^fonoster-[0-9a-f]{8}$/);
    expect(credential.password).to.match(/^[A-Za-z0-9]{24}$/);
    expect(credential.password).to.match(/[A-Z]/);
    expect(credential.password).to.match(/[a-z]/);
    expect(credential.password).to.match(/[0-9]/);
    expect(credential.extended).to.deep.equal(owned);

    expect(trunk).to.deep.include({
      name: "Twilio Trunk",
      inboundUri: INBOUND_URI,
      sendRegister: false,
      outboundCredentialsRef: credential.ref,
      extended: owned
    });
    expect(trunk.uris).to.deep.equal([
      {
        host: `${LABEL}.pstn.twilio.com`,
        port: 5060,
        transport: "UDP",
        enabled: true,
        weight: 10,
        priority: 10
      }
    ]);

    expect(number).to.deep.include({
      name: "Front desk",
      telUrl: TEL_URL,
      trunkRef: trunk.ref,
      aorLink: ROUTR_DEFAULT_PEER_AOR,
      extraHeaders: [{ name: APP_REF_HEADER, value: APP_REF }],
      extended: owned
    });

    expect(twilio.provisionTwilioTrunk).to.have.been.calledOnceWith(
      {
        accountSid: ACCOUNT_SID,
        apiKeySid: API_KEY_SID,
        apiKeySecret: API_KEY_SECRET
      },
      {
        phoneNumber: PHONE_NUMBER,
        label: LABEL,
        originationUri: `sip:${INBOUND_URI}`,
        aclEntries: ["203.0.113.10", "198.51.100.0/24"],
        sipCredential: {
          username: credential.username,
          password: credential.password
        }
      }
    );
    expect(twilio.assignTwilioNumberToTrunk).to.have.been.calledOnceWith(
      sinon.match.any,
      { phoneNumber: PHONE_NUMBER, twilioTrunkSid: TWILIO_TRUNK_SID }
    );
    expect(twilio.removeOtherTwilioSipCredentials).to.have.been.calledOnceWith(
      sinon.match.any,
      { label: LABEL, keepUsername: credential.username }
    );
    expect(callback).to.have.been.calledOnceWithExactly(null, {
      ref: number.ref,
      trunkRef: trunk.ref
    });
  });

  it("checks the appRef and refs against the caller's workspace", async function () {
    // Arrange
    const { checkNumberPreconditions, checkRefs, invoke } = await setup();

    // Act
    await invoke();

    // Assert
    expect(checkNumberPreconditions).to.have.been.calledOnceWith(
      sinon.match({ appRef: APP_REF, accessKeyId: ACCESS_KEY_ID })
    );
    expect(checkRefs).to.have.been.calledWith(ACCESS_KEY_ID);
  });

  it("returns NOT_FOUND when the app isn't in the workspace, before calling Twilio", async function () {
    // Arrange
    const { checkNumberPreconditions, twilio, invoke } = await setup();
    checkNumberPreconditions.rejects(
      new GrpcError(
        grpc.status.INVALID_ARGUMENT,
        `Application not found for ref: ${APP_REF}`
      )
    );

    // Act
    const callback = await invoke();

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.NOT_FOUND,
      message: `Application not found for ref: ${APP_REF}`
    });
    expect(twilio.provisionTwilioTrunk).to.not.have.been.called;
  });

  it("names the number after the phone number when no name is given", async function () {
    // Arrange
    const { numbers, invoke } = await setup();

    // Act
    await invoke({ name: undefined });

    // Assert
    const [number] = [...numbers.store.values()];
    expect(number.name).to.equal(PHONE_NUMBER);
  });

  it("updates a number already in the workspace in place", async function () {
    // Arrange
    const { numbers, invoke } = await setup({
      numbers: [
        {
          ref: "number-old",
          name: "Old",
          telUrl: TEL_URL,
          trunkRef: "trunk-elsewhere",
          aorLink: "sip:agent@acme.sip.fonoster.local",
          extended: owned
        }
      ]
    });

    // Act
    const callback = await invoke();

    // Assert
    expect(numbers.createNumber).to.not.have.been.called;
    const number = numbers.store.get("number-old");
    const [, response] = callback.firstCall.args;
    expect(response.ref).to.equal("number-old");
    expect(number).to.deep.include({
      name: "Front desk",
      trunkRef: response.trunkRef,
      aorLink: ROUTR_DEFAULT_PEER_AOR,
      extraHeaders: [{ name: APP_REF_HEADER, value: APP_REF }]
    });
  });

  it("ignores another workspace's number with the same telUrl", async function () {
    // Arrange
    const { numbers, invoke } = await setup({
      numbers: [
        {
          ref: "number-theirs",
          name: "Theirs",
          telUrl: TEL_URL,
          extended: { accessKeyId: "WOother" }
        }
      ]
    });

    // Act
    await invoke();

    // Assert
    expect(numbers.updateNumber).to.not.have.been.called;
    expect(numbers.createNumber).to.have.been.calledOnce;
  });

  it("gives a trunk left by the old CLI the credential and keeps its ref", async function () {
    // Arrange
    const { trunks, credentials, invoke } = await setup({
      trunks: [
        {
          ref: "trunk-cli",
          name: "Twilio Trunk",
          inboundUri: INBOUND_URI,
          sendRegister: true,
          extended: owned
        }
      ]
    });

    // Act
    const callback = await invoke();

    // Assert
    const [credential] = [...credentials.store.values()];
    expect(trunks.createTrunk).to.not.have.been.called;
    expect(trunks.store.get("trunk-cli")?.outboundCredentialsRef).to.equal(
      credential.ref
    );
    expect(callback.firstCall.args[1].trunkRef).to.equal("trunk-cli");
    expect(credentials.deleteCredentials).to.not.have.been.called;
  });

  it("creates the new credential before deleting the one the trunk pointed at", async function () {
    // Arrange
    const { trunks, credentials, invoke } = await setup({
      trunks: [
        {
          ref: "trunk-1",
          name: "Twilio Trunk",
          inboundUri: INBOUND_URI,
          sendRegister: false,
          outboundCredentialsRef: "credentials-old",
          extended: owned
        }
      ],
      credentials: [
        {
          ref: "credentials-old",
          name: `Twilio ${LABEL}`,
          username: "fonoster-00000000",
          extended: owned
        }
      ]
    });

    // Act
    await invoke();

    // Assert
    const fresh = [...credentials.store.values()].find(
      (c) => c.ref !== "credentials-old"
    );
    expect(credentials.store.has("credentials-old")).to.equal(false);
    expect(credentials.createCredentials).to.have.been.calledBefore(
      credentials.deleteCredentials
    );
    expect(trunks.updateTrunk).to.have.been.calledBefore(
      credentials.deleteCredentials
    );
    expect(credentials.deleteCredentials).to.have.been.calledOnceWith(
      "credentials-old"
    );
    expect(trunks.store.get("trunk-1")?.outboundCredentialsRef).to.equal(
      fresh?.ref
    );
  });

  const refusals: [TwilioLinkErrorReason, string, number, string][] = [
    [
      "CREDENTIALS_REFUSED",
      "trunking.trunks.list",
      grpc.status.FAILED_PRECONDITION,
      "Twilio didn't accept these credentials"
    ],
    [
      "PERMISSION_MISSING",
      "trunking.trunks.create",
      grpc.status.FAILED_PRECONDITION,
      "This Twilio key can't manage Elastic SIP Trunking. Twilio's Restricted keys can't link numbers; use a Standard API key or the Auth Token"
    ],
    [
      "PERMISSION_MISSING",
      "sip.ipAccessControlLists.create",
      grpc.status.FAILED_PRECONDITION,
      "This Twilio key can't manage SIP IP access control lists and credential lists. Twilio's Restricted keys can't link numbers; use a Standard API key or the Auth Token"
    ],
    [
      "PERMISSION_MISSING",
      "incomingPhoneNumbers.list",
      grpc.status.FAILED_PRECONDITION,
      "This Twilio key can't read or update phone numbers. Twilio's Restricted keys can't link numbers; use a Standard API key or the Auth Token"
    ],
    [
      "NUMBER_NOT_FOUND",
      "incomingPhoneNumbers.list",
      grpc.status.FAILED_PRECONDITION,
      "+18095550123 isn't in Twilio account AC…cdef"
    ],
    [
      "DOMAIN_TAKEN",
      "trunking.trunks.create",
      grpc.status.FAILED_PRECONDITION,
      `Another Twilio account already uses ${LABEL}.pstn.twilio.com; link from the Twilio account this workspace linked first`
    ],
    [
      "INVALID_CREDENTIALS",
      undefined,
      grpc.status.INVALID_ARGUMENT,
      "Twilio credentials are incomplete or malformed"
    ],
    [
      "UNAVAILABLE",
      "trunking.trunks.list",
      grpc.status.UNAVAILABLE,
      "Twilio is unavailable; try again"
    ]
  ];

  refusals.forEach(([reason, step, code, message]) => {
    it(`returns ${grpc.status[code]} when Twilio fails with ${reason} at ${step}`, async function () {
      // Arrange
      const { numbers, trunks, credentials, twilio, invoke } = await setup();
      twilio.provisionTwilioTrunk.rejects(
        new TwilioLinkError(
          reason,
          reason === "INVALID_CREDENTIALS"
            ? "Twilio credentials are incomplete or malformed"
            : `Twilio answered 400: ${API_KEY_SECRET}`,
          step
        )
      );

      // Act
      const callback = await invoke();

      // Assert
      expect(callback).to.have.been.calledOnceWithExactly({ code, message });
      expect(credentials.createCredentials).to.not.have.been.called;
      expect(trunks.createTrunk).to.not.have.been.called;
      expect(trunks.updateTrunk).to.not.have.been.called;
      expect(numbers.createNumber).to.not.have.been.called;
      expect(numbers.updateNumber).to.not.have.been.called;
      expect(twilio.assignTwilioNumberToTrunk).to.not.have.been.called;
    });
  });

  it("returns UNAVAILABLE, not INTERNAL, when Twilio fails with a plain Error", async function () {
    // Arrange
    const { twilio, invoke } = await setup();
    twilio.provisionTwilioTrunk.rejects(
      new Error("Twilio step trunking.trunks.list failed. Twilio answered 404")
    );

    // Act
    const callback = await invoke();

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.UNAVAILABLE,
      message: "Twilio is unavailable; try again"
    });
  });

  it("doesn't move the Twilio number when the Fonoster number can't be created", async function () {
    // Arrange
    const { numbers, twilio, invoke } = await setup();
    numbers.createNumber = sandbox.stub().rejects(new Error("routr is down"));

    // Act
    const callback = await invoke();

    // Assert
    expect(twilio.provisionTwilioTrunk).to.have.been.calledOnce;
    expect(twilio.assignTwilioNumberToTrunk).to.not.have.been.called;
    expect(callback).to.have.been.calledOnce;
    expect(callback.firstCall.args[0]).to.have.property("code");
    expect(callback.firstCall.args[1]).to.equal(undefined);
  });

  it("returns UNAVAILABLE when moving the number fails, and a retry converges on the same ref", async function () {
    // Arrange
    const { numbers, twilio, invoke } = await setup();
    twilio.assignTwilioNumberToTrunk
      .onFirstCall()
      .rejects(
        new TwilioLinkError(
          "UNAVAILABLE",
          "Twilio could not be reached",
          "incomingPhoneNumbers.update"
        )
      );

    // Act
    const first = await invoke();
    const second = await invoke();

    // Assert
    expect(first).to.have.been.calledOnceWithExactly({
      code: grpc.status.UNAVAILABLE,
      message: "Twilio is unavailable; try again"
    });
    expect(twilio.removeOtherTwilioSipCredentials).to.have.been.calledOnce;
    const [number] = [...numbers.store.values()];
    expect(numbers.store.size).to.equal(1);
    expect(second).to.have.been.calledOnceWith(
      null,
      sinon.match({ ref: number.ref })
    );
  });

  it("still links when cleaning up old SIP credentials fails", async function () {
    // Arrange
    const { twilio, invoke } = await setup();
    twilio.removeOtherTwilioSipCredentials.rejects(
      new TwilioLinkError("UNAVAILABLE", "down", "sip.credentialLists.list")
    );

    // Act
    const callback = await invoke();

    // Assert
    expect(callback.firstCall.args[0]).to.equal(null);
    expect(callback.firstCall.args[1]).to.have.property("ref");
  });

  [[], ["sip.fonoster.local", "edge.example.com"]].forEach(
    (signalingAddresses) => {
      it(`returns FAILED_PRECONDITION with signalingAddresses ${JSON.stringify(signalingAddresses)}`, async function () {
        // Arrange
        const { twilio, invoke } = await setup({ signalingAddresses });

        // Act
        const callback = await invoke();

        // Assert
        expect(callback).to.have.been.calledOnceWithExactly({
          code: grpc.status.FAILED_PRECONDITION,
          message: "This install has no public SIP address to allow in Twilio"
        });
        expect(twilio.provisionTwilioTrunk).to.not.have.been.called;
      });
    }
  );

  [
    {
      accountSid: ACCOUNT_SID,
      authToken: "token",
      apiKeySid: API_KEY_SID,
      apiKeySecret: API_KEY_SECRET
    },
    { accountSid: ACCOUNT_SID }
  ].forEach((credentials) => {
    it(`returns INVALID_ARGUMENT for credentials with ${Object.keys(credentials).join(", ")}`, async function () {
      // Arrange
      const { twilio, invoke } = await setup();

      // Act
      const callback = await invoke({ credentials });

      // Assert
      expect(callback).to.have.been.calledOnceWith(
        sinon.match({ code: grpc.status.INVALID_ARGUMENT })
      );
      expect(twilio.provisionTwilioTrunk).to.not.have.been.called;
    });
  });

  it("returns INVALID_ARGUMENT for a number that isn't E.164", async function () {
    // Arrange
    const { twilio, invoke } = await setup();

    // Act
    const callback = await invoke({ phoneNumber: "8095550123" });

    // Assert
    expect(callback).to.have.been.calledOnceWith(
      sinon.match({ code: grpc.status.INVALID_ARGUMENT })
    );
    expect(twilio.provisionTwilioTrunk).to.not.have.been.called;
  });

  it("never logs the Twilio secret", async function () {
    // Arrange
    const lines: string[] = [];
    for (const service of ["sipnet", "apiserver", "common"]) {
      const logger = getLogger({ service, filePath: __filename });
      for (const level of ["error", "warn", "info", "verbose", "debug"]) {
        sandbox
          .stub(logger, level)
          .callsFake((...args: unknown[]) => lines.push(JSON.stringify(args)));
      }
    }
    const { twilio, invoke } = await setup();
    twilio.removeOtherTwilioSipCredentials.rejects(
      new TwilioLinkError("UNAVAILABLE", API_KEY_SECRET, "x")
    );

    // Act
    await invoke();
    twilio.provisionTwilioTrunk.rejects(new Error(API_KEY_SECRET));
    await invoke();
    await invoke({
      credentials: { accountSid: ACCOUNT_SID, authToken: API_KEY_SECRET }
    });
    await invoke({
      credentials: {
        accountSid: ACCOUNT_SID,
        authToken: API_KEY_SECRET,
        apiKeySecret: API_KEY_SECRET
      }
    });

    // Assert
    expect(lines.length).to.be.greaterThan(0);
    expect(lines.filter((l) => l.includes(API_KEY_SECRET))).to.deep.equal([]);
  });

  it("lets a workspace member link, as CreateNumber does", function () {
    // Arrange
    const token = {
      accessKeyId: "USabc",
      access: [{ accessKeyId: ACCESS_KEY_ID, role: Role.WORKSPACE_MEMBER }]
    };

    // Act
    const allowed = hasAccess(token, LINK_METHOD, ACCESS_KEY_ID);

    // Assert
    expect(allowed).to.equal(true);
    expect(
      hasAccess(
        token,
        "/fonoster.numbers.v1beta2.Numbers/CreateNumber",
        ACCESS_KEY_ID
      )
    ).to.equal(true);
  });
});
