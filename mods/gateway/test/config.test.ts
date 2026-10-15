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
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { keyHistoryFromSet } from "@fonoster/callrecord";
import { keySetHandler } from "../src/http/keySetRoute";

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

describe("@gateway/call-record key set", function () {
  it("publishes the current key and the history, without private parts", async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "keys-"));
    const current = generateKeyPairSync("ec", { namedCurve: "P-256" });
    const old = generateKeyPairSync("ec", { namedCurve: "P-256" });
    fs.writeFileSync(
      path.join(dir, "current.pem"),
      current.privateKey.export({ type: "pkcs8", format: "pem" })
    );
    fs.writeFileSync(
      path.join(dir, "old.pub.pem"),
      old.publicKey.export({ type: "spki", format: "pem" })
    );
    const handler = keySetHandler({
      dir,
      region: "us-east",
      signingKey: {
        kid: "us-east-2026",
        privateKeyFile: path.join(dir, "current.pem")
      },
      keyHistory: [
        { kid: "us-east-2025", publicKeyFile: path.join(dir, "old.pub.pem") }
      ]
    })!;
    const server = http.createServer(handler);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const res = await fetch(
      `http://127.0.0.1:${(server.address() as AddressInfo).port}/.well-known/call-record-keys.json`
    );
    const set = await res.json();
    server.close();
    expect(res.headers.get("content-type")).to.equal(
      "application/jwk-set+json"
    );
    expect(set.keys.map((k: { kid: string }) => k.kid).sort()).to.deep.equal([
      "us-east-2025",
      "us-east-2026"
    ]);
    expect(JSON.stringify(set)).to.not.contain('"d"');
    expect(Object.keys(keyHistoryFromSet(set))).to.have.length(2);
  });
});
