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
import * as http from "http";
import { AddressInfo } from "net";
import { expect } from "chai";
import {
  adapterFor,
  isProviderAuthError,
  ProviderAuthError,
  SttStream,
  TtsAdapter
} from "../src";

// A vendor that rejects the key (#1146): every adapter that takes a vendor key reports it as a
// ProviderAuthError naming the provider, the kind and the status, never as a generic failure.

async function vendor(status: number) {
  let requests = 0;
  const server = http.createServer((req, res) => {
    requests++;
    req.resume();
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: { message: "Invalid API key" } }));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    requests: () => requests,
    close: () => {
      server.closeAllConnections();
      server.close();
    }
  };
}

/**
 * A vendor that answers an error status with a body it never finishes: the connection closes only
 * when the client lets go of the response (`closed` resolves then).
 */
async function hangingVendor(status: number) {
  let release!: () => void;
  const closed = new Promise<void>((r) => (release = r));
  const server = http.createServer((req, res) => {
    req.resume();
    res.writeHead(status, { "content-type": "application/json" });
    res.write("{");
    res.on("close", () => release());
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    closed,
    close: () => {
      server.closeAllConnections();
      server.close();
    }
  };
}

async function released(closed: Promise<void>, ms = 1000) {
  return Promise.race([
    closed.then(() => true),
    new Promise<boolean>((r) => setTimeout(() => r(false), ms))
  ]);
}

async function think(adapter: string, url: string, name?: string) {
  const llm = adapterFor(adapter)!.llm!.create(
    { baseUrl: url, apiKey: "bad", ...(name ? { name } : {}) },
    "m",
    { temperature: 0, maxTokens: 10 }
  );
  try {
    for await (const _ of llm.stream(
      [{ role: "user", content: "Hi" }],
      [],
      new AbortController().signal
    ))
      void _;
  } catch (e) {
    return e;
  }
}

async function synthesize(tts: TtsAdapter) {
  return tts
    .synthesize(
      { text: "Hi", voice: "v", language: "en-US" },
      new AbortController().signal
    )
    .catch((e) => e);
}

async function listen(stt: SttStream) {
  const errors: unknown[] = [];
  stt.on("error", (e) => errors.push(e));
  stt.write(Buffer.alloc(640));
  await new Promise((r) => setTimeout(r, 600));
  stt.close();
  return errors;
}

function expectAuthError(
  e: unknown,
  provider: string,
  kind: string,
  status: number
) {
  expect(e).to.be.instanceOf(ProviderAuthError);
  expect(e).to.include({
    provider,
    kind,
    status,
    reason: "provider_auth_failed",
    code: "provider_unavailable"
  });
  expect((e as Error).message).to.equal(
    `${provider} rejected the credentials (HTTP ${status})`
  );
}

describe("@fonoster/community rejected keys", function () {
  for (const adapter of ["openai", "groq"]) {
    it(`${adapter}: a 401 from the model is a ProviderAuthError, asked once`, async function () {
      const v = await vendor(401);
      try {
        expectAuthError(await think(adapter, v.url), adapter, "llm", 401);
        expect(v.requests()).to.equal(1);
      } finally {
        v.close();
      }
    });
  }

  it("openai: a 403 is a rejected key too", async function () {
    const v = await vendor(403);
    try {
      expectAuthError(await think("openai", v.url), "openai", "llm", 403);
    } finally {
      v.close();
    }
  });

  it("deepgram TTS: a 401 is a ProviderAuthError", async function () {
    const v = await vendor(401);
    try {
      const tts = adapterFor("deepgram")!.tts!({ apiKey: "bad", url: v.url })!;
      expectAuthError(await synthesize(tts), "deepgram", "tts", 401);
    } finally {
      v.close();
    }
  });

  it("deepgram STT: a handshake refused with 401 is one ProviderAuthError, not retried", async function () {
    const v = await vendor(401);
    try {
      const stt = adapterFor("deepgram")!.stt!({ apiKey: "bad", url: v.url })!;
      const errors = await listen(stt.open({ language: "en-US" }));
      expect(errors).to.have.length(1);
      expectAuthError(errors[0], "deepgram", "stt", 401);
      expect(v.requests()).to.equal(1);
    } finally {
      v.close();
    }
  });

  it("elevenlabs TTS: a 401 is a ProviderAuthError", async function () {
    const v = await vendor(401);
    try {
      const tts = adapterFor("elevenlabs")!.tts!({
        apiKey: "bad",
        url: v.url
      })!;
      expectAuthError(await synthesize(tts), "elevenlabs", "tts", 401);
    } finally {
      v.close();
    }
  });

  it("fake: TTS, STT and LLM map a rejected key like a vendor's", async function () {
    const v = await vendor(401);
    try {
      const fake = adapterFor("fake")!;
      expectAuthError(
        await synthesize(fake.tts!({ url: v.url })!),
        "fake",
        "tts",
        401
      );
      const errors = await listen(
        fake.stt!({ url: v.url })!.open({
          language: "en-US"
        })
      );
      expect(errors).to.have.length(1);
      expectAuthError(errors[0], "fake", "stt", 401);
      expectAuthError(await think("fake", v.url), "fake", "llm", 401);
    } finally {
      v.close();
    }
  });

  // The registry serves many catalog providers through one adapter (together through openai):
  // the error names the provider the customer configured, as resolveThink does.
  it("names the catalog provider, not the adapter serving it", async function () {
    const v = await vendor(401);
    try {
      expectAuthError(
        await think("openai", v.url, "together"),
        "together",
        "llm",
        401
      );
      const deepgram = adapterFor("deepgram")!;
      expectAuthError(
        await synthesize(
          deepgram.tts!({ apiKey: "bad", url: v.url, provider: "dg-eu" })!
        ),
        "dg-eu",
        "tts",
        401
      );
      const sttErrors = await listen(
        deepgram.stt!({ apiKey: "bad", url: v.url, provider: "dg-eu" })!.open({
          language: "en-US"
        })
      );
      expectAuthError(sttErrors[0], "dg-eu", "stt", 401);
      expectAuthError(
        await synthesize(
          adapterFor("elevenlabs")!.tts!({
            apiKey: "bad",
            url: v.url,
            provider: "el-2"
          })!
        ),
        "el-2",
        "tts",
        401
      );
      const fake = adapterFor("fake")!;
      expectAuthError(
        await synthesize(fake.tts!({ url: v.url, provider: "voices" })!),
        "voices",
        "tts",
        401
      );
      const fakeErrors = await listen(
        fake.stt!({ url: v.url, provider: "ears" })!.open({
          language: "en-US"
        })
      );
      expectAuthError(fakeErrors[0], "ears", "stt", 401);
    } finally {
      v.close();
    }
  });

  // An error answer's body is never read: it is cancelled, so the socket is let go at once.
  for (const status of [401, 500]) {
    it(`releases the connection of an HTTP ${status} answer (LLM, vendor TTS, fake TTS)`, async function () {
      const cases: [string, (url: string) => Promise<unknown>][] = [
        ["openai", (url) => think("openai", url)],
        [
          "deepgram",
          (url) =>
            synthesize(adapterFor("deepgram")!.tts!({ apiKey: "bad", url })!)
        ],
        ["fake", (url) => synthesize(adapterFor("fake")!.tts!({ url })!)]
      ];
      for (const [name, call] of cases) {
        const v = await hangingVendor(status);
        try {
          const e = await call(v.url);
          expect(e, name).to.be.instanceOf(Error);
          expect(await released(v.closed), name).to.equal(true);
        } finally {
          v.close();
        }
      }
    });
  }

  it("isProviderAuthError tells the error by its discriminant, not its class", function () {
    const own = new ProviderAuthError("openai", "llm", 401);
    // As an error from another copy of @fonoster/community looks: same shape, other class.
    const foreign = Object.assign(new Error("x"), {
      reason: "provider_auth_failed",
      provider: "openai",
      kind: "llm",
      status: 401
    });
    expect(isProviderAuthError(own)).to.equal(true);
    expect(isProviderAuthError(foreign)).to.equal(true);
    expect(isProviderAuthError(new Error("x"))).to.equal(false);
    expect(isProviderAuthError({ reason: "provider_auth_failed" })).to.equal(
      false
    );
    expect(isProviderAuthError(undefined)).to.equal(false);
  });
});
