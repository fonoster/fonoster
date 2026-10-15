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
import { GatewayConfig, loadConfig, providerKey, validateConfig } from "../src";
import { APP_AUDIO_FORMATS } from "../src/audio/pcm";
import {
  configPairAuthenticator,
  createHangupHandler,
  identityAuthenticator
} from "../src/http/hangupEndpoint";
import { generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { FileKeyCustody, keyHistoryFromSet } from "@fonoster/callrecord";
import { keyCustody } from "../src/record/keyCustody";
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

  it("accepts only formats on the audio menu (AO-B4)", function () {
    for (const audio of APP_AUDIO_FORMATS) {
      const c = base();
      c.apps[0].audio = audio;
      expect(validateConfig(c)).to.deep.equal([]);
    }
    for (const audio of [
      { codec: "opus", rate: 48000 },
      { codec: "pcmu", rate: 16000 },
      { codec: "pcm16", rate: 44100 }
    ]) {
      const c = base();
      c.apps[0].audio = audio as never;
      expect(validateConfig(c).join()).to.contain("audio must be pcm16");
    }
  });
});

describe("@gateway/hang-up endpoint", function () {
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

  it("rejects a wrong secret, or a key from another workspace", async function () {
    expect((await post("WO1", "CA1", "AP1:wrong")).status).to.equal(401);
    expect((await post("WO2", "CA3")).status).to.equal(401);
  });

  it("hangs up a live call of the key's workspace, then answers 404 / 20404", async function () {
    expect((await post("WO1", "CA1")).status).to.equal(200);
    const again = await post("WO1", "CA1");
    expect(again.status).to.equal(404);
    expect((await again.json()).code).to.equal(20404);
  });

  it("does not hang up another workspace's call", async function () {
    const res = await post("WO1", "CA3");
    expect(res.status).to.equal(404);
    expect(live.has("CA3")).to.equal(true);
  });

  it("keeps the single config pair for self-hosting", async function () {
    const auth = configPairAuthenticator({
      accountSid: "AC1",
      authToken: "tok"
    });
    expect(await auth("AC1", "AC1", "tok")).to.equal(true);
    expect(await auth("AC1", "AC1", "nope")).to.equal(false);
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

  it("resolves secret:// references when loading the file (D8)", function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-secret-"));
    fs.mkdirSync(path.join(dir, "fonoster-deepgram"));
    fs.writeFileSync(path.join(dir, "fonoster-deepgram", "key"), "dg-secret\n");
    const file = path.join(dir, "gateway.yaml");
    fs.writeFileSync(
      file,
      [
        "nats: { url: nats://x }",
        "testMode: true",
        "providers:",
        "  deepgram:",
        "    adapter: deepgram",
        "    capabilities: [stt]",
        "    credential: { value: secret://k8s/fonoster/fonoster-deepgram#key }"
      ].join("\n")
    );
    const prev = process.env.FONOSTER_SECRETS_DIR;
    process.env.FONOSTER_SECRETS_DIR = dir;
    try {
      const config = loadConfig(file);
      expect(providerKey(config.providers.deepgram)).to.equal("dg-secret");
    } finally {
      if (prev === undefined) delete process.env.FONOSTER_SECRETS_DIR;
      else process.env.FONOSTER_SECRETS_DIR = prev;
    }
    expect(() => loadConfig(file)).to.throw(
      /providers\.deepgram\.credential\.value: secret:\/\/k8s\/fonoster\/fonoster-deepgram#key: cannot read/
    );
  });

  it("publishes a key directory's keys and picks up a rotation (LO-B5)", async function () {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gw-keys-"));
    const keys = path.join(dir, "keys");
    FileKeyCustody.rotate(keys, { kid: "eu-1" });
    const config = {
      dir,
      region: "eu",
      signingKey: { dir: keys }
    };
    expect(
      validateConfig({
        nats: { url: "nats://x" },
        callRecord: config
      } as GatewayConfig)
    ).to.deep.equal([]);
    expect(
      validateConfig({
        nats: { url: "nats://x" },
        callRecord: { dir, region: "eu", signingKey: { kid: "x" } }
      } as GatewayConfig)
    ).to.include("callRecord.signingKey: set dir, or kid and privateKeyFile");
    const custody = keyCustody(config);
    expect(custody.current().kid).to.equal("eu-1");
    FileKeyCustody.rotate(keys, { kid: "eu-2" });
    expect(custody.current().kid).to.equal("eu-2");
    const server = http.createServer(keySetHandler(config)!);
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    const set = await (
      await fetch(
        `http://127.0.0.1:${(server.address() as AddressInfo).port}/.well-known/call-record-keys.json`
      )
    ).json();
    server.close();
    fs.rmSync(dir, { recursive: true, force: true });
    expect(set.keys.map((k: { kid: string }) => k.kid).sort()).to.deep.equal([
      "eu-1",
      "eu-2"
    ]);
  });
});
