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
import { GatewayConfig, validateConfig } from "../src";
import { createHangupHandler } from "../src/http/hangupEndpoint";

const base = (): GatewayConfig => ({
  nats: { url: "nats://x" },
  testMode: true,
  apps: [
    {
      ref: "a",
      url: "wss://bot.example.com",
      flavor: "native",
      signingSecret: "s",
      speech: { voice: "fake/v", language: "en" }
    }
  ],
  providers: {
    fake: { adapter: "fake", capabilities: ["tts"], tts: { url: "http://x" } }
  }
});

describe("@gateway/config", function () {
  it("accepts a valid config", function () {
    expect(validateConfig(base())).to.deep.equal([]);
  });

  it("refuses the fake adapter outside test mode", function () {
    const c = base();
    c.testMode = false;
    expect(validateConfig(c).join()).to.contain("only available in test mode");
  });

  it("checks app urls, flavors and fallbacks", function () {
    const c = base();
    c.apps[0].url = "https://bot";
    c.apps[0].fallback = { app: "missing" };
    const problems = validateConfig(c).join();
    expect(problems).to.contain("ws:// or wss://");
    expect(problems).to.contain("fallback app missing");
  });
});

describe("@gateway/hang-up endpoint", function () {
  let server: http.Server;
  let base: string;
  const live = new Set(["CA1"]);
  const nc = {
    request: async (subject: string) => {
      if (!live.has(subject.split(".")[2])) throw new Error("no responders");
      live.delete(subject.split(".")[2]);
      return { data: new Uint8Array() };
    }
  } as unknown as NatsConnection;

  before(async function () {
    server = http.createServer(
      createHangupHandler({ accountSid: "AC1", authToken: "tok" }, nc)
    );
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  after(() => server.close());

  const post = (callSid: string, auth = "AC1:tok") =>
    fetch(`${base}/2010-04-01/Accounts/AC1/Calls/${callSid}.json`, {
      method: "POST",
      headers: {
        authorization: `Basic ${Buffer.from(auth).toString("base64")}`,
        "content-type": "application/x-www-form-urlencoded"
      },
      body: "Status=completed"
    });

  it("rejects bad credentials", async function () {
    expect((await post("CA1", "AC1:wrong")).status).to.equal(401);
  });

  it("hangs up a live call with 200, then answers 404 / 20404", async function () {
    expect((await post("CA1")).status).to.equal(200);
    const again = await post("CA1");
    expect(again.status).to.equal(404);
    expect((await again.json()).code).to.equal(20404);
  });
});
