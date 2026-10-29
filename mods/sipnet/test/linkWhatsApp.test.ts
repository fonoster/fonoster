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
  ROUTR_DEFAULT_PEER_AOR
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
const OTHER_ACCESS_KEY_ID = "GRzzzz02s8tgdfghz72vb0fz538qpb5zzz";
const LABEL = ACCESS_KEY_ID.toLowerCase();
const PSTN_ROOT = "pstn.fonoster.local";
const PHONE_NUMBER = "+525512345678";
const DIGITS = "525512345678";
const TEL_URL = `tel:${PHONE_NUMBER}`;
const INBOUND_URI = `wa-${LABEL}-${DIGITS}.${PSTN_ROOT}`;
const SECOND_NUMBER = "+525598765432";
const APP_REF = "4a2f8c1e-0b7d-4a51-9e3c-2f6d7a1b9c00";
const SIP_PASSWORD = "m3ta-1ssued-s3cret-passw0rd";
const LINK_METHOD = "/fonoster.numbers.v1beta2.Numbers/LinkWhatsApp";
const TLS_ENDPOINT = {
  host: "sip.pstn.fonoster.local",
  port: 5061,
  transport: "tls"
};
const UDP_ENDPOINT = { host: "203.0.113.10", port: 5060, transport: "udp" };

type Resource = Record<string, unknown> & {
  ref: string;
  extended?: { accessKeyId?: string; sipPasswordSet?: boolean };
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
      sipPassword: SIP_PASSWORD,
      ...request
    }
  };
}

async function setup(
  options: {
    numbers?: Resource[];
    trunks?: Resource[];
    credentials?: Resource[];
    sipEndpoints?: { host: string; port: number; transport: string }[];
  } = {}
) {
  const { linkWhatsApp } = await import("../src/numbers/linkWhatsApp");
  const numbers = fakeApi("Number", options.numbers);
  const trunks = fakeApi("Trunk", options.trunks);
  const credentials = fakeApi("Credentials", options.credentials);
  const checkNumberPreconditions = sandbox.stub().resolves();
  const checkRefs = sandbox.stub().resolves();
  const routing = {
    engineFor: sandbox.stub().resolves("rebuild"),
    aorFor: sandbox.stub().resolves(ROUTR_DEFAULT_PEER_AOR),
    aorOf: sandbox.stub().returns(ROUTR_DEFAULT_PEER_AOR)
  };

  const link = linkWhatsApp({
    numbers: numbers as never,
    trunks: trunks as never,
    credentials: credentials as never,
    checkNumberPreconditions,
    routing,
    checkRefs,
    pstnRoot: PSTN_ROOT,
    sipEndpoints: options.sipEndpoints ?? [UDP_ENDPOINT, TLS_ENDPOINT]
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
    checkNumberPreconditions,
    checkRefs,
    invoke
  };
}

const owned = { accessKeyId: ACCESS_KEY_ID };

function expectNoWrites(api: ReturnType<typeof fakeApi>, resource: string) {
  expect(api[`create${resource}`]).to.not.have.been.called;
  expect(api[`update${resource}`]).to.not.have.been.called;
}

describe("@sipnet[sipnet/linkWhatsApp]", function () {
  afterEach(function () {
    return sandbox.restore();
  });

  it("creates the credential, the TLS trunk to Meta and the number, and returns the SIP server", async function () {
    // Arrange
    const { numbers, trunks, credentials, invoke } = await setup();

    // Act
    const callback = await invoke();

    // Assert
    const [credential] = [...credentials.store.values()];
    const [trunk] = [...trunks.store.values()];
    const [number] = [...numbers.store.values()];

    expect(credential).to.include({
      name: `WhatsApp ${PHONE_NUMBER}`,
      username: DIGITS,
      password: SIP_PASSWORD
    });
    expect(credential.extended).to.deep.equal({
      ...owned,
      sipPasswordSet: true
    });

    expect(trunk).to.deep.include({
      name: `WhatsApp Trunk ${PHONE_NUMBER}`,
      inboundUri: INBOUND_URI,
      sendRegister: false,
      inboundCredentialsRef: credential.ref,
      outboundCredentialsRef: credential.ref,
      normalizeToE164: true,
      rewriteFromWithNumber: true,
      fromDomain: INBOUND_URI,
      extended: owned
    });
    expect(trunk.uris).to.deep.equal([
      {
        host: "wa.meta.vc",
        port: 5061,
        transport: "TLS",
        user: DIGITS,
        enabled: true,
        weight: 10,
        priority: 10
      }
    ]);

    expect(number).to.include({ telUrl: TEL_URL, trunkRef: trunk.ref });
    expect(numbers.createNumber.firstCall.args[0]).to.include({
      name: "Front desk",
      aorLink: ROUTR_DEFAULT_PEER_AOR
    });
    expect(numbers.createNumber.firstCall.args[0].extraHeaders).to.deep.equal([
      { name: APP_REF_HEADER, value: APP_REF }
    ]);

    expect(callback).to.have.been.calledOnceWithExactly(null, {
      ref: number.ref,
      trunkRef: trunk.ref,
      sipServerHostname: INBOUND_URI,
      sipServerPort: 5061,
      sipPasswordSet: true
    });
  });

  it("links without a password first, then sets it in place, then keeps it", async function () {
    // Arrange
    const { credentials, invoke } = await setup();

    // Act
    const first = await invoke({ sipPassword: undefined });
    const [credential] = [...credentials.store.values()];
    const placeholder = credential.password;
    const second = await invoke();
    const third = await invoke({ sipPassword: undefined });

    // Assert
    expect(placeholder).to.match(/^[A-Za-z0-9]{24}$/);
    expect(first).to.have.been.calledOnceWith(
      null,
      sinon.match({ sipPasswordSet: false })
    );
    expect(credentials.store.size).to.equal(1);
    const after = credentials.store.get(credential.ref)!;
    expect(after.password).to.equal(SIP_PASSWORD);
    expect(after.extended?.sipPasswordSet).to.equal(true);
    expect(second).to.have.been.calledOnceWith(
      null,
      sinon.match({ sipPasswordSet: true })
    );
    expect(credentials.store.get(credential.ref)!.password).to.equal(
      SIP_PASSWORD
    );
    expect(third).to.have.been.calledOnceWith(
      null,
      sinon.match({ sipPasswordSet: true })
    );
  });

  for (const [name, sipEndpoints] of [
    ["no endpoints", []],
    [
      "only udp, tcp, ws and wss",
      [UDP_ENDPOINT, { ...UDP_ENDPOINT, transport: "wss" }]
    ],
    [
      "a TLS endpoint on an IP literal",
      [{ ...TLS_ENDPOINT, host: "203.0.113.10" }]
    ]
  ] as const) {
    it(`refuses with FAILED_PRECONDITION and writes nothing when the install has ${name}`, async function () {
      // Arrange
      const { numbers, trunks, credentials, invoke } = await setup({
        sipEndpoints: [...sipEndpoints]
      });

      // Act
      const callback = await invoke();

      // Assert
      expect(callback).to.have.been.calledOnceWithExactly({
        code: grpc.status.FAILED_PRECONDITION,
        message:
          "This install has no public SIP over TLS address for WhatsApp to send calls to"
      });
      expectNoWrites(credentials, "Credentials");
      expectNoWrites(trunks, "Trunk");
      expectNoWrites(numbers, "Number");
    });
  }

  it("updates a number already in the workspace in place", async function () {
    // Arrange
    const { numbers, trunks, invoke } = await setup({
      numbers: [
        {
          ref: "number-existing",
          name: "Old name",
          telUrl: TEL_URL,
          trunkRef: "trunk-old",
          extended: owned
        }
      ]
    });

    // Act
    const callback = await invoke({ name: undefined });

    // Assert
    expect(numbers.createNumber).to.not.have.been.called;
    expect(numbers.updateNumber).to.have.been.calledOnce;
    const [trunk] = [...trunks.store.values()];
    expect(numbers.updateNumber.firstCall.args[0]).to.include({
      ref: "number-existing",
      name: "Old name",
      trunkRef: trunk.ref
    });
    expect(callback).to.have.been.calledOnceWith(
      null,
      sinon.match({ ref: "number-existing" })
    );
  });

  it("refuses a number another workspace already linked, before any write", async function () {
    // Arrange
    const { numbers, trunks, credentials, invoke } = await setup({
      numbers: [
        {
          ref: "number-theirs",
          telUrl: TEL_URL,
          trunkRef: "trunk-theirs",
          extended: { accessKeyId: OTHER_ACCESS_KEY_ID }
        }
      ]
    });

    // Act
    const callback = await invoke();

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.FAILED_PRECONDITION,
      message: `${PHONE_NUMBER} is already linked in another workspace`
    });
    expectNoWrites(credentials, "Credentials");
    expectNoWrites(trunks, "Trunk");
    expectNoWrites(numbers, "Number");
  });

  it("refuses a host another workspace already uses, before any write", async function () {
    // Arrange
    const { numbers, trunks, credentials, invoke } = await setup({
      trunks: [
        {
          ref: "trunk-theirs",
          inboundUri: INBOUND_URI,
          extended: { accessKeyId: OTHER_ACCESS_KEY_ID }
        }
      ]
    });

    // Act
    const callback = await invoke();

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.FAILED_PRECONDITION,
      message: `${INBOUND_URI} is already in use`
    });
    expectNoWrites(credentials, "Credentials");
    expectNoWrites(trunks, "Trunk");
    expectNoWrites(numbers, "Number");
  });

  it("keeps the trunk and its credential on a re-link, updating both in place", async function () {
    // Arrange
    const { trunks, credentials, invoke } = await setup({
      credentials: [
        {
          ref: "cred-existing",
          name: `WhatsApp ${PHONE_NUMBER}`,
          username: DIGITS,
          password: "old",
          extended: { ...owned, sipPasswordSet: true }
        }
      ],
      trunks: [
        {
          ref: "trunk-existing",
          name: `WhatsApp Trunk ${PHONE_NUMBER}`,
          inboundUri: INBOUND_URI,
          outboundCredentialsRef: "cred-existing",
          uris: [{ host: "wa.meta.vc", port: 5061, transport: "TLS" }],
          extended: owned
        }
      ]
    });

    // Act
    const callback = await invoke();

    // Assert
    expect(trunks.createTrunk).to.not.have.been.called;
    expect(credentials.createCredentials).to.not.have.been.called;
    expect(trunks.updateTrunk.firstCall.args[0]).to.include({
      ref: "trunk-existing",
      inboundCredentialsRef: "cred-existing",
      outboundCredentialsRef: "cred-existing",
      normalizeToE164: true,
      rewriteFromWithNumber: true,
      fromDomain: INBOUND_URI
    });
    expect(credentials.store.get("cred-existing")!.password).to.equal(
      SIP_PASSWORD
    );
    expect(credentials.store.size).to.equal(1);
    expect(callback).to.have.been.calledOnceWith(
      null,
      sinon.match({ trunkRef: "trunk-existing", sipPasswordSet: true })
    );
  });

  it("gives a second WhatsApp number its own credential and trunk, leaving the first alone", async function () {
    // Arrange
    const { numbers, trunks, credentials, invoke } = await setup();
    await invoke();
    const firstTrunk = { ...[...trunks.store.values()][0] };
    const firstCredential = { ...[...credentials.store.values()][0] };

    // Act
    const callback = await invoke({
      phoneNumber: SECOND_NUMBER,
      sipPassword: "second-password"
    });

    // Assert
    expect(trunks.store.size).to.equal(2);
    expect(credentials.store.size).to.equal(2);
    expect(numbers.store.size).to.equal(2);
    expect(trunks.store.get(firstTrunk.ref)).to.deep.equal(firstTrunk);
    expect(credentials.store.get(firstCredential.ref)).to.deep.equal(
      firstCredential
    );
    expect(callback).to.have.been.calledOnceWith(
      null,
      sinon.match({
        sipServerHostname: `wa-${LABEL}-${SECOND_NUMBER.slice(1)}.${PSTN_ROOT}`
      })
    );
  });

  it("returns NOT_FOUND when the app isn't in the workspace", async function () {
    // Arrange
    const { checkNumberPreconditions, trunks, invoke } = await setup();
    checkNumberPreconditions.rejects(
      new GrpcError(
        grpc.status.INVALID_ARGUMENT,
        "The application was not found"
      )
    );

    // Act
    const callback = await invoke();

    // Assert
    expect(callback).to.have.been.calledOnceWithExactly({
      code: grpc.status.NOT_FOUND,
      message: "The application was not found"
    });
    expectNoWrites(trunks, "Trunk");
  });

  for (const [name, request] of [
    ["a number that isn't E.164", { phoneNumber: "5512345678" }],
    ["a password with a space", { sipPassword: "has a space" }],
    ["both route kinds", { agentAor: "sip:maria@acme.sip.fonoster.local" }]
  ] as const) {
    it(`returns INVALID_ARGUMENT and writes nothing for ${name}`, async function () {
      // Arrange
      const { trunks, credentials, invoke } = await setup();

      // Act
      const callback = await invoke(request);

      // Assert
      expect(callback).to.have.been.calledOnceWith(
        sinon.match({ code: grpc.status.INVALID_ARGUMENT })
      );
      expectNoWrites(credentials, "Credentials");
      expectNoWrites(trunks, "Trunk");
    });
  }

  it("never logs the SIP password", async function () {
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
    const { numbers, invoke } = await setup();

    // Act
    await invoke();
    numbers.createNumber = sandbox.stub().rejects(new Error("routr is down"));
    await invoke({ phoneNumber: SECOND_NUMBER });
    await invoke({ sipPassword: `${SIP_PASSWORD} ` });

    // Assert
    expect(lines.length).to.be.greaterThan(0);
    expect(lines.filter((l) => l.includes(SIP_PASSWORD))).to.deep.equal([]);
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
