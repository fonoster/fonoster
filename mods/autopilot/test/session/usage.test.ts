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
import { Usage } from "@fonoster/common";
import { ChatMessage, Think, ThinkChunk } from "@fonoster/community";
import { OpenAiCompatibleThink } from "@fonoster/community/openai";
import { FakeLlm, fakeUsage } from "@fonoster/conformance";
import { expect } from "chai";
import { MeteredEmbeddings } from "../../src/knowledge/MeteredEmbeddings";
import {
  ConfigCredentials,
  CredentialSource,
  LayeredCredentials,
  resolveCredential
} from "../../src/session/llm";
import { meteredThink, UsageSink } from "../../src/session/meteredThink";

// Model usage from Autopilot (add-usage-metering, group 4): vendor counts only, reported for
// completed and interrupted replies alike; missing usage is reported, never estimated.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const model = {
  catalogId: "openai/gpt-4o-mini",
  keySource: "platform" as const
};

function recordingSink() {
  const usage: Usage.UsageLine[][] = [];
  const missing: string[] = [];
  const sink: UsageSink = {
    usage: (lines) => usage.push(lines),
    missing: (id) => missing.push(id)
  };
  return { sink, usage, missing };
}

/** A model that streams words slowly and ends with a usage chunk unless told not to. */
function scripted(
  options: {
    words?: number;
    delayMs?: number;
    usage?: boolean;
    failAfter?: number;
  } = {}
): Think {
  return {
    async *stream(_m, _t, signal) {
      const words = options.words ?? 5;
      for (let i = 0; i < words; i++) {
        if (options.failAfter === i) throw new Error("vendor broke");
        await sleep(options.delayMs ?? 5);
        if (signal.aborted)
          throw Object.assign(new Error("aborted"), { name: "AbortError" });
        yield { type: "text", text: `w${i} ` } as ThinkChunk;
      }
      if (options.usage !== false)
        yield {
          type: "usage",
          usage: { inputTokens: 1200, outputTokens: 340, cachedTokens: 800 }
        };
    }
  };
}

async function read(think: Think, signal: AbortSignal, stopAfter?: number) {
  const out: ThinkChunk[] = [];
  try {
    for await (const c of think.stream(
      [{ role: "user", content: "hi" }],
      [],
      signal
    )) {
      out.push(c);
      if (stopAfter !== undefined && out.length >= stopAfter) break;
    }
  } catch (e) {
    if ((e as Error).name !== "AbortError") throw e;
  }
  return out;
}

const until = async (check: () => boolean, ms = 3000) => {
  const end = Date.now() + ms;
  while (!check()) {
    if (Date.now() > end) throw new Error("timed out");
    await sleep(10);
  }
};

describe("@autopilot model usage", function () {
  const expected = [
    {
      meter: "llm.tokens.in",
      quantity: 1200,
      provider: "openai",
      model: "openai/gpt-4o-mini",
      keySource: "platform"
    },
    {
      meter: "llm.tokens.out",
      quantity: 340,
      provider: "openai",
      model: "openai/gpt-4o-mini",
      keySource: "platform"
    },
    {
      meter: "llm.tokens.cached",
      quantity: 800,
      provider: "openai",
      model: "openai/gpt-4o-mini",
      keySource: "platform"
    }
  ];

  it("[APT-019] reports the vendor's counts for a completed reply and never forwards the usage chunk", async () => {
    const { sink, usage, missing } = recordingSink();
    const out = await read(
      meteredThink(scripted(), model, sink),
      new AbortController().signal
    );
    expect(out.every((c) => c.type === "text")).to.equal(true);
    expect(usage).to.deep.equal([expected]);
    expect(missing).to.deep.equal([]);
  });

  it("[APT-019] reports missing usage when a completed reply has none", async () => {
    const { sink, usage, missing } = recordingSink();
    await read(
      meteredThink(scripted({ usage: false }), model, sink),
      new AbortController().signal
    );
    expect(usage).to.deep.equal([]);
    expect(missing).to.deep.equal(["openai/gpt-4o-mini"]);
  });

  it("[APT-019] stops at once on barge-in but reads the rest silently for the whole request's usage", async () => {
    const { sink, usage, missing } = recordingSink();
    const abort = new AbortController();
    const think = meteredThink(
      scripted({ words: 20, delayMs: 10 }),
      model,
      sink
    );
    setTimeout(() => abort.abort(), 35);
    const started = Date.now();
    const out = await read(think, abort.signal);
    expect(Date.now() - started).to.be.below(80);
    expect(out.length).to.be.below(20);
    expect(usage).to.deep.equal([]);
    await until(() => usage.length === 1);
    expect(usage).to.deep.equal([expected]);
    expect(missing).to.deep.equal([]);
  });

  it("[APT-019] also drains when the caller stops reading (a newer turn)", async () => {
    const { sink, usage } = recordingSink();
    await read(
      meteredThink(scripted({ words: 10 }), model, sink),
      new AbortController().signal,
      2
    );
    await until(() => usage.length === 1);
    expect(usage[0]).to.deep.equal(expected);
  });

  it("[APT-019] reports missing usage when the drain runs past its deadline", async () => {
    const { sink, usage, missing } = recordingSink();
    const abort = new AbortController();
    const think = meteredThink(
      scripted({ words: 50, delayMs: 20 }),
      model,
      sink,
      { drainMs: 50 }
    );
    setTimeout(() => abort.abort(), 30);
    await read(think, abort.signal);
    await until(() => missing.length === 1);
    expect(usage).to.deep.equal([]);
  });

  it("[APT-019] closes open drains when the session ends", async () => {
    const { sink, usage, missing } = recordingSink();
    const abort = new AbortController();
    const closed = new AbortController();
    const think = meteredThink(
      scripted({ words: 50, delayMs: 20 }),
      model,
      sink,
      { closed: closed.signal }
    );
    setTimeout(() => abort.abort(), 30);
    await read(think, abort.signal);
    closed.abort();
    await until(() => missing.length === 1);
    expect(usage).to.deep.equal([]);
  });

  it("[APT-019] reports nothing for a request the vendor failed", async () => {
    const { sink, usage, missing } = recordingSink();
    let failed = false;
    try {
      await read(
        meteredThink(scripted({ failAfter: 2 }), model, sink),
        new AbortController().signal
      );
    } catch {
      failed = true;
    }
    expect(failed).to.equal(true);
    await sleep(20);
    expect([usage, missing]).to.deep.equal([[], []]);
  });

  describe("against the fake LLM", function () {
    let llm: FakeLlm;

    beforeEach(async () => {
      llm = await new FakeLlm().start();
    });
    afterEach(async () => llm.stop());

    const messages: ChatMessage[] = [
      { role: "system", content: "You are a helpful agent." },
      { role: "user", content: "When do you open?" }
    ];
    const reply = "We open at nine in the morning.";
    const fakeModel = { catalogId: "fake/llm", keySource: "platform" as const };
    const counts = fakeUsage(messages, { content: reply });

    const run = async (
      signal: AbortSignal,
      stopAfter?: number,
      sink = recordingSink()
    ) => {
      const think = meteredThink(
        new OpenAiCompatibleThink({ baseUrl: llm.url }, "fake", {
          temperature: 0,
          maxTokens: 50
        }),
        fakeModel,
        sink.sink
      );
      const out: ThinkChunk[] = [];
      try {
        for await (const c of think.stream(messages, [], signal)) {
          out.push(c);
          if (stopAfter !== undefined && out.length >= stopAfter) break;
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") throw e;
      }
      return { out, ...sink };
    };

    it("[APT-019] reports exactly the fake's counts for a completed reply", async () => {
      llm.configure({ script: [{ content: reply }] });
      const { usage } = await run(new AbortController().signal);
      expect(usage).to.deep.equal([
        [
          {
            meter: "llm.tokens.in",
            quantity: counts.prompt_tokens,
            provider: "fake",
            model: "fake/llm",
            keySource: "platform"
          },
          {
            meter: "llm.tokens.out",
            quantity: counts.completion_tokens,
            provider: "fake",
            model: "fake/llm",
            keySource: "platform"
          }
        ]
      ]);
    });

    it("[APT-019] reports the whole request's counts for an interrupted reply", async () => {
      llm.configure({ script: [{ content: reply, chunkDelayMs: 50 }] });
      const sink = recordingSink();
      const { out } = await run(new AbortController().signal, 1, sink);
      expect(out).to.have.length(1);
      await until(() => sink.usage.length === 1);
      expect(sink.usage[0].map((l) => l.quantity)).to.deep.equal([
        counts.prompt_tokens,
        counts.completion_tokens
      ]);
    });

    it("[APT-019] reports missing usage when the vendor omits it", async () => {
      llm.configure({ script: [{ content: reply }], omitUsage: true });
      const { usage, missing } = await run(new AbortController().signal);
      expect(usage).to.deep.equal([]);
      expect(missing).to.deep.equal(["fake/llm"]);
    });
  });

  describe("key sources", function () {
    const workspace: CredentialSource = {
      get: (_ref, scope) =>
        scope.workspaceRef === "ws-own" ? "own-key" : undefined
    };
    const credentials = new LayeredCredentials([
      workspace,
      new ConfigCredentials({ openai: { value: "platform-key" } })
    ]);

    it("[APT-019] says whose key a credential is", async () => {
      expect(
        await credentials.resolve("openai", { workspaceRef: "ws-own" })
      ).to.deep.equal({
        key: "own-key",
        source: "workspace"
      });
      expect(
        await credentials.resolve("openai", {
          workspaceRef: "ws-other"
        })
      ).to.deep.equal({
        key: "platform-key",
        source: "platform"
      });
      expect(
        await credentials.get("openai", { workspaceRef: "ws-own" })
      ).to.equal("own-key");
    });

    it("[APT-019] treats a single source that cannot tell as the platform's", async () => {
      expect(
        await resolveCredential(
          new ConfigCredentials({ x: { value: "k" } }),
          "x",
          {}
        )
      ).to.deep.equal({
        key: "k",
        source: "platform"
      });
    });
  });

  describe("embeddings", function () {
    let server: http.Server;
    let url: string;
    let withUsage = true;

    before(async () => {
      server = http.createServer((req, res) => {
        let body = "";
        req.on("data", (d) => (body += d));
        req.on("end", () => {
          const { input } = JSON.parse(body) as { input: string[] };
          res.writeHead(200, { "content-type": "application/json" });
          res.end(
            JSON.stringify({
              data: input
                .map((_, index) => ({ index, embedding: [index, 1] }))
                .reverse(),
              ...(withUsage
                ? {
                    usage: {
                      prompt_tokens: input.length * 7,
                      total_tokens: input.length * 7
                    }
                  }
                : {})
            })
          );
        });
      });
      await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
      url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    after(() => server.close());

    it("[APT-019] reports the vendor's tokens per request and keeps vectors in order", async () => {
      withUsage = true;
      const { sink, usage } = recordingSink();
      const e = new MeteredEmbeddings({
        apiKey: "k",
        keySource: "workspace",
        sink,
        baseUrl: url,
        batchSize: 2
      });
      expect(await e.embedDocuments(["a", "b", "c"])).to.deep.equal([
        [0, 1],
        [1, 1],
        [0, 1]
      ]);
      expect(await e.embedQuery("q")).to.deep.equal([0, 1]);
      expect(
        usage.flat().map((l) => [l.meter, l.quantity, l.keySource, l.model])
      ).to.have.deep.members([
        ["embedding.tokens", 14, "workspace", "openai/text-embedding-ada-002"],
        ["embedding.tokens", 7, "workspace", "openai/text-embedding-ada-002"],
        ["embedding.tokens", 7, "workspace", "openai/text-embedding-ada-002"]
      ]);
    });

    it("[APT-019] reports missing usage when the vendor sends none", async () => {
      withUsage = false;
      const { sink, missing } = recordingSink();
      await new MeteredEmbeddings({
        apiKey: "k",
        keySource: "platform",
        sink,
        baseUrl: url
      }).embedQuery("q");
      expect(missing).to.deep.equal(["openai/text-embedding-ada-002"]);
    });
  });
});
