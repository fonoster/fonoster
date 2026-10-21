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
import { expect } from "chai";
import WebSocket from "ws";
import { serveFakes } from "../src/fakes/serve";

describe("@conformance[fakes server]", function () {
  it("serves TTS, a scripted STT and the echo LLM on the given host and ports", async function () {
    const fakes = await serveFakes({
      FAKES_HOST: "127.0.0.1",
      FAKES_TTS_PORT: "0",
      FAKES_STT_PORT: "0",
      FAKES_LLM_PORT: "0",
      FAKES_STT_SCRIPT: JSON.stringify([{ atMs: 20, text: "hello" }]),
      FAKES_OAUTH2_PORT: "0"
    });
    try {
      const tts = await fetch(`${fakes.tts.url}/v1/synthesize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: "hi" })
      });
      expect(tts.status).to.equal(200);
      expect((await tts.arrayBuffer()).byteLength).to.be.greaterThan(0);

      const llm = await fetch(`${fakes.llm.url}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] })
      });
      const body = (await llm.json()) as {
        choices: { message: { content: string } }[];
      };
      expect(body.choices[0].message.content).to.equal("Echo: ping");

      const ws = new WebSocket(
        `${fakes.stt.url.replace("http", "ws")}/v1/listen?codec=pcm16&rate=16000`
      );
      const transcript = await new Promise<string>((resolve, reject) => {
        ws.on("open", () => ws.send(Buffer.alloc(16000 * 2 * 0.04)));
        ws.on("message", (raw) => resolve(JSON.parse(raw.toString()).text));
        ws.on("error", reject);
      });
      ws.close();
      expect(transcript).to.equal("hello");
    } finally {
      await Promise.all([fakes.tts.stop(), fakes.stt.stop(), fakes.llm.stop()]);
    }
  });
});

describe("@conformance[fake oauth2]", function () {
  it("github profile: authorize, code, token, user and emails for the chosen email", async function () {
    const { FakeOAuth2 } = await import("../src/fakes/providers/FakeOAuth2");
    const provider = await new FakeOAuth2("github", "ada@acme.com").start(0, "127.0.0.1");
    try {
      const back = "http://app.test/oauth/github/callback";
      const authorize = await fetch(
        `${provider.url}/login/oauth/authorize?redirect_uri=${encodeURIComponent(back)}&state=s1&email=ada%40acme.com`,
        { redirect: "manual" }
      );
      const location = new URL(authorize.headers.get("location")!);
      if (authorize.status !== 302 || location.origin + location.pathname !== back)
        throw new Error(`expected a redirect to ${back}, got ${authorize.status} ${location}`);
      if (location.searchParams.get("state") !== "s1") throw new Error("state not echoed");
      const code = location.searchParams.get("code")!;
      const token = (await (
        await fetch(`${provider.url}/login/oauth/access_token`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ client_id: "x", client_secret: "y", code })
        })
      ).json()) as { access_token: string };
      const headers = { authorization: `Bearer ${token.access_token}` };
      const user = (await (await fetch(`${provider.url}/user`, { headers })).json()) as { login: string };
      const emails = (await (await fetch(`${provider.url}/user/emails`, { headers })).json()) as {
        email: string;
        primary: boolean;
        verified: boolean;
      }[];
      if (user.login !== "ada") throw new Error(`login ${user.login}`);
      if (emails[0].email !== "ada@acme.com" || !emails[0].primary || !emails[0].verified)
        throw new Error(`emails ${JSON.stringify(emails)}`);
      // A code is good once.
      const again = (await (
        await fetch(`${provider.url}/login/oauth/access_token`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ code })
        })
      ).json()) as { error?: string };
      if (again.error !== "bad_verification_code") throw new Error("code reused");
    } finally {
      await provider.stop();
    }
  });

  it("oidc profile: standard paths, form-encoded token request, one userinfo", async function () {
    const { FakeOAuth2 } = await import("../src/fakes/providers/FakeOAuth2");
    const provider = await new FakeOAuth2("oidc", "ada@acme.com").start(0, "127.0.0.1");
    try {
      const back = "http://app.test/callback";
      const authorize = await fetch(
        `${provider.url}/authorize?redirect_uri=${encodeURIComponent(back)}&state=s2&email=ada%40acme.com`,
        { redirect: "manual" }
      );
      const code = new URL(authorize.headers.get("location")!).searchParams.get("code")!;
      const token = (await (
        await fetch(`${provider.url}/token`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ grant_type: "authorization_code", code }).toString()
        })
      ).json()) as { access_token: string };
      const info = (await (
        await fetch(`${provider.url}/userinfo`, { headers: { authorization: `Bearer ${token.access_token}` } })
      ).json()) as { email: string; email_verified: boolean };
      if (info.email !== "ada@acme.com" || !info.email_verified) throw new Error(JSON.stringify(info));
    } finally {
      await provider.stop();
    }
  });
});
