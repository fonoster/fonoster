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
import * as grpc from "@grpc/grpc-js";
import * as chai from "chai";
import { expect } from "chai";
import chaiAsPromised from "chai-as-promised";
import { createSandbox } from "sinon";
import sinonChai from "sinon-chai";
import { createCheckRefs, RefLookups } from "../src/resources/checkRefs";
import { TEST_TOKEN } from "./testToken";

chai.use(chaiAsPromised);
chai.use(sinonChai);
const sandbox = createSandbox();

// The caller's workspace (in TEST_TOKEN's access list) and another one.
const MINE = "GRahn02s8tgdfghz72vb0fz538qpb5z35p";
const THEIRS = "WOtherworkspace00000000000000000000";

function metadata() {
  const m = new grpc.Metadata();
  m.set("token", TEST_TOKEN);
  m.set("accesskeyid", MINE);
  return m;
}

/** Routr lookups: refs starting with "mine-" are the caller's, "theirs-" another workspace's. */
function lookups(): RefLookups {
  const get = async (ref: string) => {
    if (ref.startsWith("mine-"))
      return { ref, extended: { accessKeyId: MINE } };
    if (ref.startsWith("theirs-"))
      return { ref, extended: { accessKeyId: THEIRS } };
    throw Object.assign(new Error("not found"), {
      code: grpc.status.NOT_FOUND
    });
  };
  return { Acl: get, Credentials: get, Domain: get, Number: get, Trunk: get };
}

const checkRefs = () => createCheckRefs(lookups());

async function invoke(
  handler: (call: unknown, callback: unknown) => Promise<unknown> | unknown,
  request: Record<string, unknown>
) {
  const callback = sandbox.stub();
  await handler({ metadata: metadata(), request }, callback);
  return callback;
}

const trunk = {
  name: "Carrier",
  inboundUri: "carrier.fonoster.local",
  uris: [
    {
      host: "sip.carrier.example.com",
      port: 5060,
      transport: "UDP",
      weight: 10,
      priority: 1
    }
  ]
};

describe("@sipnet[resources/checkRefs] references stay in the caller's workspace (H7)", function () {
  afterEach(() => sandbox.restore());

  describe("createCheckRefs", function () {
    it("accepts the caller's own refs and skips blank ones", async function () {
      await checkRefs()(MINE, [
        { field: "domainRef", kind: "Domain", ref: "mine-d" },
        { field: "credentialsRef", kind: "Credentials", ref: "" },
        { field: "accessControlListRef", kind: "Acl", ref: undefined }
      ]);
    });

    it("refuses another workspace's ref and a missing one alike", async function () {
      for (const ref of ["theirs-c", "missing-c"]) {
        await expect(
          checkRefs()(MINE, [
            { field: "credentialsRef", kind: "Credentials", ref }
          ])
        )
          .to.be.rejectedWith(`credentialsRef ${ref} not found`)
          .and.eventually.include({ code: grpc.status.INVALID_ARGUMENT });
      }
    });

    it("refuses refs when the caller's workspace is unknown", async function () {
      await expect(
        checkRefs()(undefined, [
          { field: "trunkRef", kind: "Trunk", ref: "mine-t" }
        ])
      ).to.eventually.be.rejected.and.include({
        code: grpc.status.PERMISSION_DENIED
      });
    });

    it("passes other lookup errors on", async function () {
      const failing = createCheckRefs({
        ...lookups(),
        Acl: async () => {
          throw Object.assign(new Error("routr down"), {
            code: grpc.status.UNAVAILABLE
          });
        }
      });
      await expect(
        failing(MINE, [
          { field: "accessControlListRef", kind: "Acl", ref: "mine-a" }
        ])
      ).to.be.rejectedWith("routr down");
    });
  });

  describe("trunks", function () {
    for (const field of [
      "accessControlListRef",
      "inboundCredentialsRef",
      "outboundCredentialsRef"
    ]) {
      it(`createTrunk refuses another workspace's ${field}`, async function () {
        const { createTrunk } = await import("../src/trunks/operations");
        const api = { createTrunk: sandbox.stub().resolves({ ref: "t1" }) };
        const callback = await invoke(createTrunk(api as never, checkRefs()), {
          ...trunk,
          [field]: "theirs-x"
        });
        expect(callback.firstCall.args[0]).to.include({
          code: grpc.status.INVALID_ARGUMENT
        });
        expect(api.createTrunk).to.not.have.been.called;
      });
    }

    it("createTrunk accepts the caller's own credentials and ACL", async function () {
      const { createTrunk } = await import("../src/trunks/operations");
      const api = { createTrunk: sandbox.stub().resolves({ ref: "t1" }) };
      const callback = await invoke(createTrunk(api as never, checkRefs()), {
        ...trunk,
        accessControlListRef: "mine-a",
        inboundCredentialsRef: "mine-c1",
        outboundCredentialsRef: "mine-c2"
      });
      expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "t1" });
      expect(api.createTrunk).to.have.been.calledWithMatch({
        outboundCredentialsRef: "mine-c2",
        extended: { accessKeyId: MINE }
      });
    });

    it("updateTrunk refuses another workspace's outbound credentials", async function () {
      const { updateTrunk } = await import("../src/trunks/operations");
      const api = {
        getTrunk: sandbox
          .stub()
          .resolves({ ref: "t1", ...trunk, extended: { accessKeyId: MINE } }),
        updateTrunk: sandbox.stub().resolves({ ref: "t1" })
      };
      const callback = await invoke(updateTrunk(api as never, checkRefs()), {
        ref: "t1",
        outboundCredentialsRef: "theirs-c"
      });
      expect(callback.firstCall.args[0]).to.include({
        code: grpc.status.INVALID_ARGUMENT
      });
      expect(api.updateTrunk).to.not.have.been.called;
    });
  });

  describe("agents", function () {
    const agent = { name: "Jane", username: "jane" };

    for (const [field, ref] of [
      ["domainRef", "theirs-d"],
      ["credentialsRef", "theirs-c"]
    ]) {
      it(`createAgent refuses another workspace's ${field}`, async function () {
        const { createAgent } = await import("../src/agents/operations");
        const api = { createAgent: sandbox.stub().resolves({ ref: "a1" }) };
        const callback = await invoke(createAgent(api as never, checkRefs()), {
          ...agent,
          [field]: ref
        });
        expect(callback.firstCall.args[0]).to.include({
          code: grpc.status.INVALID_ARGUMENT
        });
        expect(api.createAgent).to.not.have.been.called;
      });
    }

    it("createAgent accepts the caller's own domain and credentials", async function () {
      const { createAgent } = await import("../src/agents/operations");
      const api = { createAgent: sandbox.stub().resolves({ ref: "a1" }) };
      const callback = await invoke(createAgent(api as never, checkRefs()), {
        ...agent,
        domainRef: "mine-d",
        credentialsRef: "mine-c"
      });
      expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "a1" });
    });

    it("updateAgent refuses moving an agent into another workspace's domain", async function () {
      const { updateAgent } = await import("../src/agents/operations");
      const api = {
        getAgent: sandbox
          .stub()
          .resolves({ ref: "a1", extended: { accessKeyId: MINE } }),
        updateAgent: sandbox.stub().resolves({ ref: "a1" })
      };
      const callback = await invoke(updateAgent(api as never, checkRefs()), {
        ref: "a1",
        domainRef: "theirs-d"
      });
      expect(callback.firstCall.args[0]).to.include({
        code: grpc.status.INVALID_ARGUMENT
      });
      expect(api.updateAgent).to.not.have.been.called;
    });
  });

  describe("domains", function () {
    it("createDomain refuses another workspace's ACL or egress number", async function () {
      const { createDomain } = await import("../src/domains/operations");
      for (const extra of [
        { accessControlListRef: "theirs-a" },
        { egressPolicies: [{ rule: ".*", numberRef: "theirs-n" }] }
      ]) {
        const api = { createDomain: sandbox.stub().resolves({ ref: "d1" }) };
        const callback = await invoke(createDomain(api as never, checkRefs()), {
          name: "Acme",
          domainUri: "acme.fonoster.local",
          ...extra
        });
        expect(callback.firstCall.args[0], JSON.stringify(extra)).to.include({
          code: grpc.status.INVALID_ARGUMENT
        });
        expect(api.createDomain).to.not.have.been.called;
      }
    });

    it("updateDomain accepts an egress policy on the caller's own number", async function () {
      const { updateDomain } = await import("../src/domains/operations");
      const api = {
        getDomain: sandbox
          .stub()
          .resolves({ ref: "d1", extended: { accessKeyId: MINE } }),
        updateDomain: sandbox.stub().resolves({ ref: "d1" })
      };
      const callback = await invoke(updateDomain(api as never, checkRefs()), {
        ref: "d1",
        egressPolicies: [{ rule: ".*", numberRef: "mine-n" }]
      });
      expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "d1" });
    });
  });

  describe("numbers", function () {
    const number = {
      name: "Main line",
      telUrl: "tel:+15550001111",
      city: "Durham",
      country: "USA",
      countryIsoCode: "US"
    };

    it("createNumber refuses another workspace's trunk", async function () {
      const { createNumber } = await import("../src/numbers/createNumber");
      const api = { createNumber: sandbox.stub().resolves({ ref: "n1" }) };
      const callback = await invoke(
        createNumber(api as never, sandbox.stub(), undefined, checkRefs()),
        { ...number, trunkRef: "theirs-t" }
      );
      expect(callback.firstCall.args[0]).to.include({
        code: grpc.status.INVALID_ARGUMENT
      });
      expect(api.createNumber).to.not.have.been.called;
    });

    it("createNumber accepts the caller's own trunk", async function () {
      const { createNumber } = await import("../src/numbers/createNumber");
      const api = { createNumber: sandbox.stub().resolves({ ref: "n1" }) };
      const callback = await invoke(
        createNumber(api as never, sandbox.stub(), undefined, checkRefs()),
        { ...number, trunkRef: "mine-t" }
      );
      expect(callback).to.have.been.calledOnceWithExactly(null, { ref: "n1" });
    });

    it("updateNumber refuses another workspace's trunk and another workspace's number", async function () {
      const { updateNumber } = await import("../src/numbers/updateNumber");
      for (const [owner, trunkRef, code] of [
        [MINE, "theirs-t", grpc.status.INVALID_ARGUMENT],
        [THEIRS, "mine-t", grpc.status.PERMISSION_DENIED]
      ] as const) {
        const api = {
          getNumber: sandbox.stub().resolves({
            ref: "n1",
            ...number,
            extended: { accessKeyId: owner }
          }),
          updateNumber: sandbox.stub().resolves({ ref: "n1" })
        };
        const callback = await invoke(
          updateNumber(api as never, sandbox.stub(), undefined, checkRefs()),
          { ref: "n1", trunkRef }
        );
        expect(callback.firstCall.args[0]).to.include({ code });
        expect(api.updateNumber).to.not.have.been.called;
      }
    });

    it("getNumber refuses another workspace's number", async function () {
      const { getNumber } = await import("../src/numbers/getNumber");
      const api = {
        getNumber: sandbox
          .stub()
          .resolves({ ref: "n1", ...number, extended: { accessKeyId: THEIRS } })
      };
      const callback = await invoke(getNumber(api as never), { ref: "n1" });
      expect(callback.firstCall.args[0]).to.include({
        code: grpc.status.PERMISSION_DENIED
      });
    });
  });

  describe("acls", function () {
    it("updateAcl refuses another workspace's ACL", async function () {
      const { updateAcl } = await import("../src/acls/updateAcl");
      const api = {
        getAcl: sandbox
          .stub()
          .resolves({ ref: "acl1", extended: { accessKeyId: THEIRS } }),
        updateAcl: sandbox.stub().resolves({ ref: "acl1" })
      };
      const callback = await invoke(updateAcl(api as never), {
        ref: "acl1",
        name: "Office",
        allow: ["10.0.0.0/8"]
      });
      expect(callback.firstCall.args[0]).to.include({
        code: grpc.status.PERMISSION_DENIED
      });
      expect(api.updateAcl).to.not.have.been.called;
    });

    it("updateAcl updates the caller's own ACL", async function () {
      const { updateAcl } = await import("../src/acls/updateAcl");
      const api = {
        getAcl: sandbox
          .stub()
          .resolves({ ref: "acl1", extended: { accessKeyId: MINE } }),
        updateAcl: sandbox.stub().resolves({ ref: "acl1" })
      };
      const callback = await invoke(updateAcl(api as never), {
        ref: "acl1",
        name: "Office",
        allow: ["10.0.0.0/8"]
      });
      expect(callback).to.have.been.calledOnceWithExactly(null, {
        ref: "acl1"
      });
      expect(api.updateAcl).to.have.been.calledWithMatch({
        deny: ["0.0.0.0/0"]
      });
    });
  });
});
