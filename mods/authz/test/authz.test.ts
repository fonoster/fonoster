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
import {
  AuthzClient,
  AuthzHandler,
  AuthzServer,
  SessionDecision
} from "../src";
import { DummyAuthzHandler } from "../src/server/DummyAuthzHandler";

chai.use(chaiAsPromised);

// Session admission over gRPC (add-billing-service D7): refusals carry a reason, and handlers that
// answer a plain boolean keep working.

const request = {
  appRef: "app-1",
  accessKeyId: "WO00000000000000000000000000000000",
  callRef: "call-1"
};

function handler(answer: boolean | SessionDecision, delayMs = 0): AuthzHandler {
  return {
    checkSessionAuthorized: async () => {
      await new Promise((r) => setTimeout(r, delayMs));
      return answer;
    },
    checkMethodAuthorized: async () => true,
    addBillingMeterEvent: async () => undefined
  };
}

async function serve(h: AuthzHandler) {
  const server = new AuthzServer({ bind: "127.0.0.1", port: 0 });
  const port = await server.listen(h);
  return { server, client: new AuthzClient(`127.0.0.1:${port}`) };
}

describe("@authz", function () {
  let server: AuthzServer | undefined;
  afterEach(() => server?.close());

  it("admits through the dummy handler", async function () {
    const s = await serve(new DummyAuthzHandler());
    server = s.server;
    expect(await s.client.checkSession(request)).to.deep.equal({
      authorized: true
    });
  });

  it("carries the reason of a refusal", async function () {
    const s = await serve(
      handler({ authorized: false, reason: "insufficient_balance" })
    );
    server = s.server;
    expect(await s.client.checkSession(request)).to.deep.equal({
      authorized: false,
      reason: "insufficient_balance"
    });
    expect(await s.client.checkSessionAuthorized(request)).to.equal(false);
  });

  it("accepts a handler that answers a plain boolean", async function () {
    const s = await serve(handler(false));
    server = s.server;
    expect(await s.client.checkSession(request)).to.deep.equal({
      authorized: false
    });
  });

  it("fails a check that outlives its deadline", async function () {
    const s = await serve(handler(true, 300));
    server = s.server;
    await expect(s.client.checkSession(request, 50)).to.be.rejectedWith(
      /checkSession failed/
    );
  });
});
