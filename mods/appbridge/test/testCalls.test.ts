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
import { createPublicKey, createSign, generateKeyPairSync } from "crypto";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { expect } from "chai";
import { connect, NatsConnection } from "nats";
import { FakesHarness } from "@fonoster/conformance";
import { AppConfig, AppBridge } from "../src";
import { TestCallVerifier, verifyRs256 } from "../src/testCalls";

// Browser test calls (add-talk-in-browser D4): a call with X-Connect-Token reaches only apps of
// the token's workspace.
const NATS_URL = process.env.CONFORMANCE_NATS_URL;

const pair = () =>
  generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" }
  });
const IDENTITY = pair();
const OTHER = pair();

function sign(
  payload: Record<string, unknown>,
  privateKey = IDENTITY.privateKey,
  alg = "RS256"
) {
  const enc = (o: object) =>
    Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const body = `${enc({ alg, typ: "JWT" })}.${enc({ iat: now, exp: now + 3600, ...payload })}`;
  const s = createSign("RSA-SHA256");
  s.update(body);
  return `${body}.${s.sign(privateKey).toString("base64url")}`;
}

const token = (extra: Record<string, unknown> = {}) =>
  sign({
    aorLink: "sip:roomr@default",
    accessKeyId: "WO-A",
    allowedMethods: ["INVITE"],
    ...extra
  });

describe("@appbridge test calls (add-talk-in-browser)", function () {
  let keyFile: string;

  before(() => {
    keyFile = path.join(
      fs.mkdtempSync(path.join(os.tmpdir(), "gw-testcalls-")),
      "public.pem"
    );
    fs.writeFileSync(keyFile, IDENTITY.publicKey);
  });

  describe("TestCallVerifier", function () {
    const headers = (t: string) => ({ "X-Connect-Token": t });

    it("passes calls without a token", function () {
      expect(new TestCallVerifier().check({}, "WO-A")).to.deep.equal({
        ok: true,
        test: false
      });
    });

    it("accepts a token of the app's workspace (header name in any case)", function () {
      const v = new TestCallVerifier(keyFile);
      expect(v.check(headers(token()), "WO-A")).to.deep.equal({
        ok: true,
        test: true
      });
      expect(v.check({ "x-connect-token": token() }, "WO-A").ok).to.equal(true);
      // YAML apps have no workspace: the signature is enough.
      expect(v.check(headers(token()), undefined).ok).to.equal(true);
    });

    it("passes on who placed the test call (#1060)", function () {
      const v = new TestCallVerifier(keyFile);
      expect(
        v.check(headers(token({ caller: "ada@acme.com" })), "WO-A")
      ).to.deep.equal({ ok: true, test: true, caller: "ada@acme.com" });
    });

    it("rejects another workspace, a forged or expired token, and missing methods", function () {
      const v = new TestCallVerifier(keyFile);
      const reason = (t: string, ws = "WO-A") => v.check(headers(t), ws).reason;
      expect(reason(token(), "WO-B")).to.equal("workspace");
      expect(
        reason(
          sign(
            { accessKeyId: "WO-A", allowedMethods: ["INVITE"] },
            OTHER.privateKey
          )
        )
      ).to.equal("signature");
      expect(reason(token({ exp: 1000 }))).to.equal("expired");
      expect(reason(token({ allowedMethods: ["MESSAGE"] }))).to.equal("method");
      expect(reason(token({ allowedMethods: undefined }))).to.equal("method");
      expect(reason("not-a-jwt")).to.equal("malformed");
    });

    it("rejects tokens when no public key is configured", function () {
      expect(
        new TestCallVerifier().check(headers(token()), "WO-A").reason
      ).to.equal("not_configured");
    });

    it("refuses algorithms other than RS256", function () {
      const parts = token().split(".");
      const none = `${Buffer.from(JSON.stringify({ alg: "none" })).toString("base64url")}.${parts[1]}.`;
      const key = createPublicKey(IDENTITY.publicKey);
      expect(verifyRs256(none, key)).to.deep.equal({ reason: "algorithm" });
    });
  });

  describe("AppBridge end to end", function () {
    let nc: NatsConnection;
    let harness: FakesHarness;
    let appbridge: AppBridge | undefined;

    before(async function () {
      if (!NATS_URL) return this.skip();
      nc = await connect({ servers: NATS_URL });
    });
    after(async () => nc?.close());

    beforeEach(async () => {
      harness = await new FakesHarness().start();
      harness.roomrNode.attachNats(nc);
      const app: AppConfig = {
        ref: "agent-a",
        url: harness.app.url,
        protocol: "fonoster",
        signingSecret: "s",
        workspaceRef: "WO-A",
        speech: { voice: "fake/default", language: "en-US" }
      };
      const urls = harness.providerUrls;
      appbridge = await new AppBridge({
        config: {
          nats: { url: NATS_URL! },
          apps: [app],
          testCalls: { publicKeyFile: keyFile },
          providers: {
            fake: {
              adapter: "fake",
              capabilities: ["tts", "stt"],
              tts: { url: urls.tts },
              stt: { url: urls.stt }
            }
          }
        },
        nats: nc
      }).start();
    });

    afterEach(async () => {
      await appbridge?.stop();
      appbridge = undefined;
      await harness?.stop();
    });

    const until = async (cond: () => boolean, ms = 4000) => {
      const end = Date.now() + ms;
      while (!cond()) {
        if (Date.now() > end) throw new Error("timed out");
        await new Promise((r) => setTimeout(r, 20));
      }
    };

    it("answers a browser call with a token of the agent's workspace", async function () {
      const { roomRef } = harness.roomrNode.offerCall({
        appRef: "agent-a",
        headers: { "X-Connect-Token": token(), "X-App-Ref": "agent-a" }
      });
      const { peer } = await harness.app.nextConnection();
      expect(peer).to.exist;
      await until(() => harness.roomrNode.sipStatuses(roomRef).includes(200));
      harness.roomrNode.callerHangup(roomRef);
    });

    it("rejects a token of another workspace with 403", async function () {
      const { roomRef } = harness.roomrNode.offerCall({
        appRef: "agent-a",
        headers: { "X-Connect-Token": token({ accessKeyId: "WO-B" }) }
      });
      await until(() => harness.roomrNode.sipStatuses(roomRef).includes(403));
      expect(harness.roomrNode.sipStatuses(roomRef)).to.not.include(200);
    });
  });
});
