/*
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
import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import { NatsConnection } from "nats";
import {
  configPairAuthenticator,
  createHangupHandler,
  identityAuthenticator
} from "../src/http/hangupEndpoint";

// The Twilio-compatible Calls endpoint that hangs up a twilio-protocol stream
// (twilio-media-streams-flavor "Hanging up from a Twilio-protocol stream"; catalog VSD-015).
describe("@appbridge/hang-up endpoint", function () {
  let server: http.Server;
  let base: string;
  // Calls this fake bus knows: callSid -> owning workspace.
  const live = new Map([
    ["CA1", "WO1"],
    ["CA2", "WO1"],
    ["CA3", "WO2"]
  ]);
  const nc = {
    request: async (subject: string, data: Uint8Array) => {
      const callSid = subject.split(".")[2];
      const owner = live.get(callSid);
      if (!owner) throw new Error("no responders");
      const { accountSid } = JSON.parse(Buffer.from(data).toString());
      if (accountSid !== owner)
        return {
          data: Buffer.from(
            JSON.stringify({ type: "error", code: "not_found" })
          )
        };
      live.delete(callSid);
      return { data: Buffer.from(JSON.stringify({ type: "ack" })) };
    }
  } as unknown as NatsConnection;

  // A fake Identity: API key AP1/secret belongs to workspace WO1.
  const token = (workspace: string) =>
    `x.${Buffer.from(JSON.stringify({ access: [{ accessKeyId: workspace, role: "WORKSPACE_ADMIN" }] })).toString("base64url")}.y`;
  const identity = {
    exchangeApiKey: async (id: string, secret: string) => {
      if (id === "AP1" && secret === "secret")
        return { accessToken: token("WO1") };
      throw new Error("Invalid credentials");
    }
  };

  before(async function () {
    server = http.createServer(
      createHangupHandler(identityAuthenticator(identity), nc)
    );
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => server.close());

  const post = (account: string, callSid: string, auth = "AP1:secret") =>
    fetch(`${base}/2010-04-01/Accounts/${account}/Calls/${callSid}.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: "Status=completed"
    });

  it("[VSD-015] rejects a wrong secret, or a key from another workspace", async function () {
    expect((await post("WO1", "CA1", "AP1:wrong")).status).to.equal(401);
    expect((await post("WO2", "CA3")).status).to.equal(401);
  });

  it("[VSD-015] hangs up a live call of the key's workspace, then answers 404 / 20404", async function () {
    expect((await post("WO1", "CA1")).status).to.equal(200);
    const again = await post("WO1", "CA1");
    expect(again.status).to.equal(404);
    expect((await again.json()).code).to.equal(20404);
  });

  it("[VSD-015] does not hang up another workspace's call", async function () {
    const res = await post("WO1", "CA3");
    expect(res.status).to.equal(404);
    expect(live.has("CA3")).to.equal(true);
  });

  it("[VSD-015] keeps the single config pair for self-hosting", async function () {
    const auth = configPairAuthenticator({
      accountSid: "AC1",
      authToken: "tok"
    });
    expect(await auth("AC1", "AC1", "tok")).to.equal(true);
    expect(await auth("AC1", "AC1", "nope")).to.equal(false);
  });
});
