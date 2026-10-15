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
import { DeepgramSttAdapter, DeepgramTtsAdapter } from "../src/speech/deepgram";
import { ElevenLabsTtsAdapter } from "../src/speech/elevenlabs";

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

describe("@gateway vendor adapters", function () {
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
    for (const [status, code] of [
      [401, "provider_unavailable"],
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

  it("requires a credential for vendor providers", function () {
    const base = { nats: { url: "nats://x" }, apps: [] };
    const missing = validateConfig({
      ...base,
      providers: { dg: { adapter: "deepgram", capabilities: ["stt"] } }
    });
    expect(missing.join()).to.contain("no credential");
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
