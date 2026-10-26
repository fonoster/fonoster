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
import WebSocket from "ws";
import { SpeechError, Transcript, validateConfig } from "../src";
import {
  DeepgramSttAdapter,
  DeepgramTtsAdapter
} from "@fonoster/community/deepgram";
import { ElevenLabsTtsAdapter } from "@fonoster/community/elevenlabs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Seen = {
  method?: string;
  url?: string;
  headers?: http.IncomingHttpHeaders;
  body?: string;
};

async function vendor(
  handler: (
    req: http.IncomingMessage,
    res: http.ServerResponse,
    seen: Seen
  ) => void
) {
  const seen: Seen = {};
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    Object.assign(seen, {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: Buffer.concat(chunks).toString()
    });
    handler(req, res, seen);
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    server,
    seen,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`
  };
}

async function drain(audio: AsyncIterable<Buffer>) {
  const out: Buffer[] = [];
  for await (const c of audio) out.push(c);
  return out;
}

describe("@appbridge vendor adapters", function () {
  it("Deepgram TTS asks for 16 kHz linear PCM and keeps samples whole", async function () {
    const v = await vendor((_req, res) => {
      res.writeHead(200, { "content-type": "audio/l16" });
      res.write(Buffer.alloc(3, 1));
      res.write(Buffer.alloc(5, 2));
      res.end(Buffer.alloc(2, 3));
    });
    const tts = new DeepgramTtsAdapter({ apiKey: "dg-key", baseUrl: v.url });
    const chunks = await drain(
      (
        await tts.synthesize(
          { text: "Hi", voice: "aura-2-thalia-en", language: "en" },
          new AbortController().signal
        )
      ).audio
    );
    v.server.close();
    expect(v.seen.url).to.equal(
      "/v1/speak?model=aura-2-thalia-en&encoding=linear16&sample_rate=16000&container=none"
    );
    expect(v.seen.headers?.authorization).to.equal("Token dg-key");
    expect(JSON.parse(v.seen.body!)).to.deep.equal({ text: "Hi" });
    expect(chunks.every((c) => c.length % 2 === 0)).to.equal(true);
    expect(Buffer.concat(chunks).length).to.equal(10);
  });

  it("maps vendor failures to session error codes", async function () {
    // A rejected key (401/403) is a ProviderAuthError (community authErrors.test.ts).
    for (const [status, code] of [
      [503, "provider_unavailable"],
      [400, "bad_message"]
    ] as const) {
      const v = await vendor((_req, res) => res.writeHead(status).end("nope"));
      const tts = new DeepgramTtsAdapter({ apiKey: "k", baseUrl: v.url });
      const error = await tts
        .synthesize(
          { text: "Hi", voice: "v", language: "en" },
          new AbortController().signal
        )
        .catch((e) => e);
      v.server.close();
      expect(error).to.be.instanceOf(SpeechError);
      expect(error.code).to.equal(code);
    }
    const hang = await vendor(() => undefined);
    const slow = new DeepgramTtsAdapter({
      apiKey: "k",
      baseUrl: hang.url,
      timeoutMs: 150
    });
    const error = await slow
      .synthesize(
        { text: "Hi", voice: "v", language: "en" },
        new AbortController().signal
      )
      .catch((e) => e);
    hang.server.closeAllConnections();
    hang.server.close();
    expect(error.code).to.equal("provider_timeout");
  });

  it("TTS timeouts bound each wait, not a body read at playback pace", async function () {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    // 6 chunks 80 ms apart: 480 ms in all, longer than the 150 ms timeout, no gap longer.
    const steady = await vendor(async (_req, res) => {
      res.writeHead(200);
      for (let i = 0; i < 6; i++) {
        res.write(Buffer.alloc(320, 1));
        await sleep(80);
      }
      res.end();
    });
    const tts = new DeepgramTtsAdapter({
      apiKey: "k",
      baseUrl: steady.url,
      timeoutMs: 150
    });
    const chunks = await drain(
      (
        await tts.synthesize(
          { text: "A long reply", voice: "v", language: "en" },
          new AbortController().signal
        )
      ).audio
    );
    steady.server.close();
    expect(Buffer.concat(chunks).length).to.equal(6 * 320);

    // A body that stops sending for longer than the timeout is a stall.
    const stuck = await vendor((_req, res) => {
      res.writeHead(200);
      res.write(Buffer.alloc(320, 1));
    });
    const stalled = new DeepgramTtsAdapter({
      apiKey: "k",
      baseUrl: stuck.url,
      timeoutMs: 150
    });
    const error = await drain(
      (
        await stalled.synthesize(
          { text: "Hi", voice: "v", language: "en" },
          new AbortController().signal
        )
      ).audio
    ).catch((e) => e);
    stuck.server.closeAllConnections();
    stuck.server.close();
    expect(error).to.be.instanceOf(SpeechError);
    expect(error.code).to.equal("provider_timeout");
  });

  it("ElevenLabs streams raw 16 kHz PCM for the voice id", async function () {
    const v = await vendor((_req, res) =>
      res.writeHead(200).end(Buffer.alloc(640))
    );
    const tts = new ElevenLabsTtsAdapter({ apiKey: "xi-key", baseUrl: v.url });
    const chunks = await drain(
      (
        await tts.synthesize(
          { text: "Hola", voice: "21m00Tcm4TlvDq8ikWAM", language: "es" },
          new AbortController().signal
        )
      ).audio
    );
    v.server.close();
    expect(v.seen.url).to.equal(
      "/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream?output_format=pcm_16000"
    );
    expect(v.seen.headers?.["xi-api-key"]).to.equal("xi-key");
    expect(JSON.parse(v.seen.body!)).to.deep.equal({
      text: "Hola",
      model_id: "eleven_flash_v2_5"
    });
    expect(Buffer.concat(chunks).length).to.equal(640);
  });

  it("Deepgram STT streams audio and reports interim and final transcripts", async function () {
    const connections: { url: string; auth?: string; closeStream: boolean }[] =
      [];
    const server = new WebSocket.Server({
      host: "127.0.0.1",
      port: 0,
      path: "/v1/listen"
    });
    await new Promise((r) => server.once("listening", r));
    server.on("connection", (socket, req) => {
      const c = {
        url: req.url!,
        auth: req.headers.authorization,
        closeStream: false
      };
      connections.push(c);
      let frames = 0;
      socket.on("message", (data, isBinary) => {
        if (!isBinary) {
          if (JSON.parse(data.toString()).type === "CloseStream")
            c.closeStream = true;
          return;
        }
        frames++;
        if (frames === 2) {
          socket.send(
            JSON.stringify({
              type: "Results",
              is_final: false,
              channel: {
                alternatives: [{ transcript: "pay my", confidence: 0.6 }]
              }
            })
          );
          socket.send(
            JSON.stringify({
              type: "Results",
              is_final: true,
              channel: {
                alternatives: [{ transcript: "pay my bill", confidence: 0.97 }]
              }
            })
          );
        }
      });
    });
    const port = (server.address() as AddressInfo).port;
    const stt = new DeepgramSttAdapter({
      apiKey: "dg-key",
      baseUrl: `http://127.0.0.1:${port}`
    }).open({ language: "en" });
    const transcripts: Transcript[] = [];
    stt.on("transcript", (t: Transcript) => transcripts.push(t));
    stt.write(Buffer.alloc(640));
    stt.write(Buffer.alloc(640));
    await sleep(150);
    expect(connections[0].url)
      .to.contain("model=nova-3")
      .and.contain("encoding=linear16")
      .and.contain("sample_rate=16000")
      .and.contain("language=en");
    expect(connections[0].auth).to.equal("Token dg-key");
    expect(transcripts).to.deep.equal([
      { text: "pay my", final: false, language: "en", confidence: 0.6 },
      { text: "pay my bill", final: true, language: "en", confidence: 0.97 }
    ]);

    stt.update({ language: "es" });
    await sleep(100);
    expect(connections).to.have.length(2);
    expect(connections[1].url).to.contain("language=es");
    expect(connections[0].closeStream).to.equal(true);
    stt.close();
    server.close();
  });

  /** A local stand-in for Deepgram's /v1/listen WebSocket. */
  async function fakeListen(
    onConnection: (socket: WebSocket, url: string, index: number) => void
  ) {
    const urls: string[] = [];
    const server = new WebSocket.Server({
      host: "127.0.0.1",
      port: 0,
      path: "/v1/listen"
    });
    await new Promise((r) => server.once("listening", r));
    server.on("connection", (socket, req) => {
      urls.push(req.url!);
      onConnection(socket, req.url!, urls.length - 1);
    });
    const port = (server.address() as AddressInfo).port;
    return { server, urls, url: `http://127.0.0.1:${port}` };
  }

  const results = (text: string, final = true) =>
    JSON.stringify({
      type: "Results",
      is_final: final,
      channel: { alternatives: [{ transcript: text, confidence: 0.9 }] }
    });

  it("Deepgram STT sends hints as keyterm on Nova-3 and keywords on older models", async function () {
    const v = await fakeListen(() => undefined);
    const adapter = new DeepgramSttAdapter({ apiKey: "k", baseUrl: v.url });
    const a = adapter.open({ language: "en", hints: ["Fonoster", "Routr"] });
    const b = adapter.open({
      language: "en",
      hints: ["Fonoster"],
      model: "nova-2-phonecall"
    });
    await sleep(100);
    a.close();
    b.close();
    v.server.close();
    const [nova3, nova2] = v.urls.map(
      (u) => new URL(u, "http://x").searchParams
    );
    expect(nova3.get("model")).to.equal("nova-3");
    expect(nova3.getAll("keyterm")).to.deep.equal(["Fonoster", "Routr"]);
    expect(nova2.get("model")).to.equal("nova-2-phonecall");
    expect(nova2.getAll("keywords")).to.deep.equal(["Fonoster"]);
    expect(nova2.getAll("keyterm")).to.deep.equal([]);
  });

  // PR5/VO-B1: Deepgram may close a live stream on its side (1011, NET-0001). The adapter used to
  // go quietly deaf: no error, no transcript, every later frame dropped.
  it("Deepgram STT reconnects after the vendor closes the stream and keeps the audio", async function () {
    const frames: number[] = [0, 0];
    const v = await fakeListen((socket, _url, i) => {
      socket.on("message", (_d, binary) => {
        if (!binary) return;
        frames[i]++;
        if (i === 0 && frames[0] === 2) socket.close(1011, "NET-0001");
        if (i === 1 && frames[1] === 3) socket.send(results("still here"));
      });
    });
    const stt = new DeepgramSttAdapter({ apiKey: "k", baseUrl: v.url }).open({
      language: "en"
    });
    const heard: string[] = [];
    const errors: string[] = [];
    stt.on("transcript", (t: Transcript) => heard.push(t.text));
    stt.on("error", (e: Error) => errors.push(e.message));
    for (let i = 0; i < 6; i++) {
      stt.write(Buffer.alloc(640));
      await sleep(60);
    }
    await sleep(500);
    stt.close();
    v.server.close();
    expect(v.urls).to.have.length(2);
    expect(errors).to.deep.equal([]);
    expect(heard).to.deep.equal(["still here"]);
    expect(frames[0] + frames[1]).to.be.at.least(5);
  });

  it("Deepgram STT reports a stream that keeps failing", async function () {
    const v = await fakeListen((socket) => socket.close(1011, "NET-0000"));
    const stt = new DeepgramSttAdapter({ apiKey: "k", baseUrl: v.url }).open({
      language: "en"
    });
    const errors: SpeechError[] = [];
    stt.on("error", (e: SpeechError) => errors.push(e));
    await sleep(2000);
    stt.close();
    v.server.close();
    expect(errors).to.have.length(1);
    expect(errors[0].code).to.equal("provider_unavailable");
    expect(errors[0].message).to.contain("1011");
  });

  it("Deepgram STT keeps the last words when hints or language change", async function () {
    const v = await fakeListen((socket, _url, i) => {
      socket.on("message", (d, binary) => {
        // The vendor only sends the pending final once asked to finalize.
        if (!binary && i === 0 && JSON.parse(d.toString()).type === "Finalize")
          setTimeout(() => socket.send(results("my account number")), 50);
      });
    });
    const stt = new DeepgramSttAdapter({ apiKey: "k", baseUrl: v.url }).open({
      language: "en"
    });
    const heard: string[] = [];
    stt.on("transcript", (t: Transcript) => heard.push(t.text));
    stt.write(Buffer.alloc(640));
    await sleep(100);
    stt.update({ hints: ["Fonoster"] });
    await sleep(200);
    stt.close();
    v.server.close();
    expect(heard).to.deep.equal(["my account number"]);
    expect(new URL(v.urls[1], "http://x").searchParams.get("keyterm")).to.equal(
      "Fonoster"
    );
  });

  // PR5: Deepgram works through audio at about real-time pace even when it arrives faster, so the
  // final can come seconds after the last frame; closing after a fixed wait dropped it.
  it("Deepgram STT finish() waits for the vendor's last results", async function () {
    const v = await fakeListen((socket) => {
      socket.on("message", (d, binary) => {
        if (binary || JSON.parse(d.toString()).type !== "CloseStream") return;
        setTimeout(() => {
          socket.send(results("this is a live check"));
          socket.close(1000);
        }, 300);
      });
    });
    const stt = new DeepgramSttAdapter({ apiKey: "k", baseUrl: v.url }).open({
      language: "en"
    });
    const heard: string[] = [];
    stt.on("transcript", (t: Transcript) => heard.push(t.text));
    stt.write(Buffer.alloc(640));
    await sleep(50);
    await stt.finish(2000);
    v.server.close();
    expect(heard).to.deep.equal(["this is a live check"]);
    expect(v.urls).to.have.length(1);
  });

  it("Deepgram STT reports a rejected handshake once and does not retry", async function () {
    const v = await vendor((_req, res) => res.writeHead(401).end());
    const stt = new DeepgramSttAdapter({ apiKey: "bad", baseUrl: v.url }).open({
      language: "en"
    });
    const errors: SpeechError[] = [];
    stt.on("error", (e: SpeechError) => errors.push(e));
    await sleep(800);
    stt.close();
    v.server.close();
    expect(errors.map((e) => e.message)).to.deep.equal([
      "deepgram rejected the credentials (HTTP 401)"
    ]);
  });

  it("requires a credential for vendor providers", function () {
    const base = { nats: { url: "nats://x" }, apps: [] };
    const missing = validateConfig({
      ...base,
      providers: { dg: { adapter: "deepgram", capabilities: ["stt"] } }
    });
    expect(missing.join()).to.contain("no credential");
    // With workspace keys, a provider needs no platform key (self-host install, no vendor keys).
    expect(
      validateConfig({
        ...base,
        database: { url: "postgresql://x" },
        workspaceKeys: { enabled: true },
        providers: { dg: { adapter: "deepgram", capabilities: ["stt"] } }
      })
    ).to.deep.equal([]);
    process.env.TEST_DG_KEY = "k";
    expect(
      validateConfig({
        ...base,
        providers: {
          dg: {
            adapter: "deepgram",
            capabilities: ["stt"],
            credential: { env: "TEST_DG_KEY" }
          }
        }
      })
    ).to.deep.equal([]);
  });
});
