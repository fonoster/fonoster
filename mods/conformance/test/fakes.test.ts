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
import { expect } from "chai";
import WebSocket from "ws";
import {
  FakeApp,
  FakeAppBridge,
  FakeLlm,
  FakeStt,
  FakeTts,
  ProviderLedger,
  speechDurationMs,
  wordTimings
} from "../src";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("@conformance/FakeApp and FakeAppBridge", function () {
  let app: FakeApp;

  afterEach(async function () {
    await app?.stop();
  });

  it("accepts a correctly signed connection and exchanges frames", async function () {
    app = await new FakeApp({
      signingSecret: "s3cret",
      verifySignature: true
    }).start();
    const appBridgeSide = await new FakeAppBridge({
      signingSecret: "s3cret"
    }).dial(app.url);
    const appSide = (await app.nextConnection()).peer;

    appBridgeSide.sendJson({ type: "session.start" });
    const frame = await appSide.frames.waitUntil(
      () => appSide.frames.items[0],
      Date.now() + 1000
    );
    expect(frame?.kind).to.equal("json");
    expect(app.attempts[0].accepted).to.equal(true);
    appBridgeSide.close();
  });

  it("refuses a connection signed with the wrong secret", async function () {
    app = await new FakeApp({
      signingSecret: "s3cret",
      verifySignature: true
    }).start();
    let error: Error | undefined;
    await new FakeAppBridge({ signingSecret: "wrong" })
      .dial(app.url)
      .catch((e) => (error = e));
    expect(error?.message).to.contain("401");
    expect(app.attempts[0]).to.include({ accepted: false, reason: "mismatch" });
  });

  it("refuses a stale signature", async function () {
    app = await new FakeApp({
      signingSecret: "s3cret",
      verifySignature: true
    }).start();
    let error: Error | undefined;
    await new FakeAppBridge({
      signingSecret: "s3cret",
      timestamp: Math.floor(Date.now() / 1000) - 10 * 60
    })
      .dial(app.url)
      .catch((e) => (error = e));
    expect(error).to.exist;
    expect(app.attempts[0].reason).to.equal("stale");
  });
});

describe("@conformance/fake providers", function () {
  const ledger = new ProviderLedger();
  const tts = new FakeTts(ledger);
  const stt = new FakeStt(ledger);
  const llm = new FakeLlm(ledger);

  before(async function () {
    await Promise.all([tts.start(), stt.start(), llm.start()]);
  });

  after(async function () {
    await Promise.all([tts.stop(), stt.stop(), llm.stop()]);
  });

  const post = (url: string, body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });

  it("TTS returns deterministic audio and word timings after the injected delay", async function () {
    tts.configure({ delayMs: 100 });
    const started = Date.now();
    const res = await post(`${tts.url}/v1/synthesize`, { text: "Hello there" });
    const audio = Buffer.from(await res.arrayBuffer());
    expect(res.status).to.equal(200);
    expect(Date.now() - started).to.be.at.least(95);
    expect(audio.length).to.equal(
      (speechDurationMs("Hello there") / 1000) * 16000 * 2
    );
    expect(JSON.parse(res.headers.get("x-fake-word-timings")!)).to.deep.equal(
      wordTimings("Hello there")
    );
    expect(ledger.delayBetween(started, Date.now())).to.be.within(95, 130);
    tts.configure({ delayMs: 0 });
  });

  it("TTS fails the next request once when told to", async function () {
    tts.configure({ failNext: "provider_unavailable" });
    expect(
      (await post(`${tts.url}/v1/synthesize`, { text: "a" })).status
    ).to.equal(503);
    expect(
      (await post(`${tts.url}/v1/synthesize`, { text: "a" })).status
    ).to.equal(200);
  });

  it("TTS holds the request open for provider_timeout", async function () {
    tts.configure({ failNext: "provider_timeout" });
    const outcome = await Promise.race([
      post(`${tts.url}/v1/synthesize`, { text: "a" }).then(() => "answered"),
      sleep(200).then(() => "held")
    ]);
    expect(outcome).to.equal("held");
  });

  it("STT emits scripted transcripts by caller-audio time", async function () {
    stt.configure({ script: [{ atMs: 100, text: "I want to pay my bill" }] });
    const socket = new WebSocket(
      `${stt.url.replace("http", "ws")}/v1/listen?language=en-US`
    );
    const messages: Record<string, unknown>[] = [];
    socket.on("message", (m) => messages.push(JSON.parse(m.toString())));
    await new Promise((r) => socket.once("open", r));

    socket.send(Buffer.alloc(640 * 4)); // 80 ms
    await sleep(30);
    expect(messages).to.have.length(0);
    socket.send(Buffer.alloc(640)); // 100 ms
    await sleep(30);
    expect(messages[0]).to.include({
      type: "transcript",
      text: "I want to pay my bill",
      final: true,
      language: "en-US"
    });
    socket.close();
  });

  it("LLM streams scripted replies, then echoes", async function () {
    llm.configure({ script: [{ content: "Your balance is 42 dollars." }] });
    const res = await post(`${llm.url}/v1/chat/completions`, {
      stream: true,
      messages: [{ role: "user", content: "balance?" }]
    });
    const text = await res.text();
    const content = text
      .split("\n\n")
      .filter((l) => l.startsWith("data: {"))
      .map((l) => JSON.parse(l.slice(6)).choices[0].delta.content ?? "")
      .join("");
    expect(content).to.equal("Your balance is 42 dollars.");
    expect(text.trim().endsWith("data: [DONE]")).to.equal(true);

    const echo = await (
      await post(`${llm.url}/v1/chat/completions`, {
        messages: [{ role: "user", content: "hi" }]
      })
    ).json();
    expect(echo.choices[0].message.content).to.equal("Echo: hi");
  });
});
