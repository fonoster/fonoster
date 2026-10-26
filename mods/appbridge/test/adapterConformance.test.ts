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
import * as fs from "fs";
import * as http from "http";
import { AddressInfo } from "net";
import * as path from "path";
import { expect } from "chai";
import WebSocket from "ws";
import { parse } from "yaml";
import { SpeechError, SttAdapter, Transcript, TtsAdapter } from "../src";
import {
  DeepgramSttAdapter,
  DeepgramTtsAdapter
} from "@fonoster/community/deepgram";
import { ProviderAuthError } from "@fonoster/community";
import { ElevenLabsTtsAdapter } from "@fonoster/community/elevenlabs";

// Adapter conformance per type (add-provider-registry task 1.5, build log LO-B14): every feature
// a catalog model declares for a speech adapter is checked, cancelling is fast, and vendor errors
// map to provider_unavailable. Runs against local stand-ins of the vendors; live runs are on demand
// (mods/appbridge/scripts/live-check.ts), never here.

const SEED = path.join(
  __dirname,
  "../../../ops/rebuild/config/catalog-seed.yaml"
);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type SeedEntry = {
  kind: string;
  id: string;
  type?: string;
  adapter?: string;
  features?: string[];
};

/** Declared features of each speech model in the seed, by adapter and type. */
function declared(): {
  adapter: string;
  type: string;
  id: string;
  features: string[];
}[] {
  const entries = (
    parse(fs.readFileSync(SEED, "utf8")) as { entries: SeedEntry[] }
  ).entries;
  const adapterOf = new Map(
    entries.filter((e) => e.kind === "provider").map((e) => [e.id, e.adapter!])
  );
  return entries
    .filter((e) => e.kind === "model" && (e.type === "stt" || e.type === "tts"))
    .map((e) => ({
      adapter: adapterOf.get(e.id.split("/")[0])!,
      type: e.type!,
      id: e.id,
      features: e.features ?? []
    }));
}

// ---- TTS ------------------------------------------------------------------------------------

type TtsBehavior =
  | "ok"
  | "slow-body"
  | "status-503"
  | "status-401"
  | "no-answer";

/** An HTTP stand-in that streams raw 16 kHz PCM the way both TTS vendors answer. */
async function ttsStandIn(behavior: () => TtsBehavior) {
  const sockets = new Set<import("net").Socket>();
  let finishedAt = 0;
  const server = http.createServer(async (req, res) => {
    for await (const _ of req) void _;
    const b = behavior();
    if (b === "no-answer") return;
    if (b.startsWith("status-"))
      return res.writeHead(Number(b.slice(7))).end("vendor error");
    res.writeHead(200, { "content-type": "audio/l16" });
    res.write(Buffer.alloc(3200, 1)); // 100 ms
    await sleep(b === "slow-body" ? 5000 : 150);
    if (res.destroyed) return;
    res.end(Buffer.alloc(3200, 2));
    finishedAt = Date.now();
  });
  server.on("connection", (s) => {
    sockets.add(s);
    s.on("close", () => sockets.delete(s));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    finishedAt: () => finishedAt,
    close() {
      sockets.forEach((s) => s.destroy());
      server.close();
    }
  };
}

const TTS_ADAPTERS: Record<string, (baseUrl: string) => TtsAdapter> = {
  deepgram: (baseUrl) =>
    new DeepgramTtsAdapter({ apiKey: "k", baseUrl, timeoutMs: 300 }),
  elevenlabs: (baseUrl) =>
    new ElevenLabsTtsAdapter({ apiKey: "k", baseUrl, timeoutMs: 300 })
};

/** How each TTS feature is verified; a declared feature without a check fails the suite. */
const TTS_FEATURES: Record<
  string,
  (make: (baseUrl: string) => TtsAdapter) => Promise<void>
> = {
  async streaming(make) {
    const v = await ttsStandIn(() => "ok");
    try {
      const s = await make(v.url).synthesize(
        { text: "Hello there.", voice: "v", language: "en" },
        new AbortController().signal
      );
      let firstAt = 0;
      let bytes = 0;
      for await (const chunk of s.audio) {
        firstAt ||= Date.now();
        bytes += chunk.length;
        expect(chunk.length % 2, "whole 16-bit samples").to.equal(0);
      }
      expect(bytes).to.equal(6400);
      // The first audio arrived while the vendor was still producing the rest.
      expect(firstAt).to.be.lessThan(v.finishedAt());
    } finally {
      v.close();
    }
  }
};

// ---- STT ------------------------------------------------------------------------------------

/** A stand-in for Deepgram's /v1/listen: answers each second frame with interim + final results. */
async function listenStandIn(
  onSocket: (socket: WebSocket, url: string) => void = (socket) => {
    let frames = 0;
    socket.on("message", (_d, binary) => {
      if (!binary || ++frames !== 2) return;
      socket.send(
        JSON.stringify({
          type: "Results",
          is_final: false,
          start: 0,
          duration: 0.5,
          channel: { alternatives: [{ transcript: "pay my", confidence: 0.6 }] }
        })
      );
      socket.send(
        JSON.stringify({
          type: "Results",
          is_final: true,
          start: 0,
          duration: 0.9,
          channel: {
            alternatives: [
              {
                transcript: "pay my bill",
                confidence: 0.95,
                words: [
                  { word: "pay", start: 0.1, end: 0.3 },
                  { word: "my", start: 0.3, end: 0.45 },
                  {
                    word: "bill",
                    punctuated_word: "bill.",
                    start: 0.5,
                    end: 0.9
                  }
                ]
              }
            ]
          }
        })
      );
    });
  }
) {
  const urls: string[] = [];
  const closedAt: number[] = [];
  const server = new WebSocket.Server({
    host: "127.0.0.1",
    port: 0,
    path: "/v1/listen"
  });
  await new Promise((r) => server.once("listening", r));
  server.on("connection", (socket, req) => {
    urls.push(req.url!);
    socket.on("close", () => closedAt.push(Date.now()));
    onSocket(socket, req.url!);
  });
  return {
    urls,
    closedAt,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => server.close()
  };
}

const STT_ADAPTERS: Record<string, (baseUrl: string) => SttAdapter> = {
  deepgram: (baseUrl) => new DeepgramSttAdapter({ apiKey: "k", baseUrl })
};

async function transcribe(adapter: SttAdapter, language = "en") {
  const stream = adapter.open({ language, model: "nova-3" });
  const out: Transcript[] = [];
  stream.on("transcript", (t: Transcript) => out.push(t));
  stream.on("error", () => undefined);
  stream.write(Buffer.alloc(640));
  stream.write(Buffer.alloc(640));
  for (let i = 0; i < 40 && out.length < 2; i++) await sleep(25);
  stream.close();
  return out;
}

const STT_FEATURES: Record<
  string,
  (make: (baseUrl: string) => SttAdapter) => Promise<void>
> = {
  async streaming(make) {
    const v = await listenStandIn();
    try {
      // Results arrive while the stream is open, before it is closed.
      expect(await transcribe(make(v.url))).to.have.length(2);
    } finally {
      v.close();
    }
  },
  async "interim-results"(make) {
    const v = await listenStandIn();
    try {
      const out = await transcribe(make(v.url));
      expect(out.map((t) => [t.text, t.final])).to.deep.equal([
        ["pay my", false],
        ["pay my bill", true]
      ]);
    } finally {
      v.close();
    }
  },
  async "word-timings"(make) {
    const v = await listenStandIn();
    try {
      const final = (await transcribe(make(v.url))).find((t) => t.final)!;
      expect(final).to.deep.include({ startMs: 0, endMs: 900 });
      expect(final.words).to.deep.equal([
        { word: "pay", startMs: 100, endMs: 300 },
        { word: "my", startMs: 300, endMs: 450 },
        { word: "bill.", startMs: 500, endMs: 900 }
      ]);
    } finally {
      v.close();
    }
  },
  async multilingual(make) {
    const v = await listenStandIn();
    try {
      const out = await transcribe(make(v.url), "multi");
      expect(v.urls[0]).to.contain("language=multi");
      expect(out.at(-1)!.language).to.equal("multi");
    } finally {
      v.close();
    }
  }
};

// ---- the suite --------------------------------------------------------------------------------

describe("@appbridge adapter conformance (registry 1.5)", function () {
  this.timeout(20000);

  const models = declared();

  it("finds the speech models the catalog seed declares", function () {
    expect(models.map((m) => m.id)).to.include.members([
      "deepgram/nova-3",
      "deepgram/aura-2",
      "elevenlabs/eleven_flash_v2_5"
    ]);
  });

  for (const m of models) {
    const checks = m.type === "tts" ? TTS_FEATURES : STT_FEATURES;
    const make =
      m.type === "tts" ? TTS_ADAPTERS[m.adapter] : STT_ADAPTERS[m.adapter];
    describe(`${m.id} (${m.adapter} ${m.type})`, function () {
      it("has a built-in adapter", function () {
        expect(make, `no ${m.type} adapter ${m.adapter}`).to.be.a("function");
      });
      for (const feature of m.features)
        it(`verifies declared feature ${feature}`, async function () {
          const check = checks[feature];
          expect(
            check,
            `no conformance check for ${m.type} feature ${feature}`
          ).to.be.a("function");
          await (check as (f: unknown) => Promise<void>)(make);
        });
    });
  }

  for (const [name, make] of Object.entries(TTS_ADAPTERS)) {
    describe(`TTS adapter ${name}`, function () {
      it("cancels fast: aborting stops the audio within 200 ms", async function () {
        const v = await ttsStandIn(() => "slow-body");
        try {
          const ctl = new AbortController();
          const s = await make(v.url).synthesize(
            { text: "A long reply.", voice: "v", language: "en" },
            ctl.signal
          );
          const it = s.audio[Symbol.asyncIterator]();
          await it.next(); // first audio
          const pending = it.next().catch(() => ({ done: true }));
          const at = Date.now();
          ctl.abort();
          const r = await pending;
          expect(Date.now() - at).to.be.lessThan(200);
          expect(r.done).to.equal(true);
        } finally {
          v.close();
        }
      });

      it("maps vendor errors to provider_unavailable (and silence to provider_timeout)", async function () {
        for (const [behavior, code, type] of [
          ["status-503", "provider_unavailable", SpeechError],
          // A rejected key is its own error, fatal to the call (#1146).
          ["status-401", "provider_unavailable", ProviderAuthError],
          ["no-answer", "provider_timeout", SpeechError]
        ] as const) {
          const v = await ttsStandIn(() => behavior);
          try {
            const e = await make(v.url)
              .synthesize(
                { text: "Hi", voice: "v", language: "en" },
                new AbortController().signal
              )
              .catch((x) => x);
            expect(e, behavior).to.be.instanceOf(type);
            expect(e.code, behavior).to.equal(code);
          } finally {
            v.close();
          }
        }
        // Nobody listening at all.
        const e = await make("http://127.0.0.1:9")
          .synthesize(
            { text: "Hi", voice: "v", language: "en" },
            new AbortController().signal
          )
          .catch((x) => x);
        expect(e.code).to.equal("provider_unavailable");
      });
    });
  }

  for (const [name, make] of Object.entries(STT_ADAPTERS)) {
    describe(`STT adapter ${name}`, function () {
      it("cancels fast: close() ends the vendor stream within 200 ms", async function () {
        const v = await listenStandIn(() => undefined);
        try {
          const stream = make(v.url).open({ language: "en" });
          stream.on("error", () => undefined);
          stream.write(Buffer.alloc(640));
          for (let i = 0; i < 40 && !v.urls.length; i++) await sleep(10);
          await sleep(50);
          const at = Date.now();
          stream.close();
          for (let i = 0; i < 40 && !v.closedAt.length; i++) await sleep(5);
          expect(v.closedAt[0] - at).to.be.lessThan(200);
        } finally {
          v.close();
        }
      });

      it("maps a vendor that keeps failing to provider_unavailable", async function () {
        const v = await listenStandIn((socket) =>
          socket.close(1011, "NET-0001")
        );
        try {
          const stream = make(v.url).open({ language: "en" });
          const error = await new Promise<SpeechError>((resolve) =>
            stream.on("error", resolve)
          );
          stream.write(Buffer.alloc(640));
          expect(error.code).to.equal("provider_unavailable");
          stream.close();
        } finally {
          v.close();
        }
      });
    });
  }
});
