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
import { AddressInfo, Socket } from "net";
import * as path from "path";
import { expect } from "chai";
import { parse } from "yaml";
import { OPENAI_COMPATIBLE } from "../../src/session/llm";
import {
  OpenAiCompatibleThink,
  ThinkChunk,
  ThinkError
} from "../../src/session/think";

// LLM adapter conformance (add-provider-registry task 1.5, build log LO-B14): every feature a
// catalog LLM declares is checked against an OpenAI-compatible stand-in, cancelling is fast, and
// vendor errors map to provider_unavailable. No vendor is called.

const SEED = path.join(
  __dirname,
  "../../../../ops/rebuild/config/catalog-seed.yaml"
);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Reply = {
  text?: string;
  toolCall?: string;
  slow?: boolean;
  status?: number;
};

/** An OpenAI-compatible Chat Completions stand-in that records request bodies. */
async function standIn(reply: () => Reply) {
  const bodies: Record<string, unknown>[] = [];
  const sockets = new Set<Socket>();
  let finishedAt = 0;
  const server = http.createServer(async (req, res) => {
    let raw = "";
    for await (const c of req) raw += c;
    bodies.push(JSON.parse(raw));
    const r = reply();
    if (r.status) return res.writeHead(r.status).end("{}");
    res.writeHead(200, { "content-type": "text/event-stream" });
    const send = (delta: unknown) =>
      res.write(
        `data: ${JSON.stringify({ choices: [{ index: 0, delta }] })}\n\n`
      );
    if (r.toolCall) {
      send({
        tool_calls: [
          { index: 0, id: "c1", function: { name: r.toolCall, arguments: "" } }
        ]
      });
      send({ tool_calls: [{ index: 0, function: { arguments: '{"a":1}' } }] });
    } else {
      for (const word of (r.text ?? "Hello there.").split(" ")) {
        send({ content: `${word} ` });
        await sleep(r.slow ? 5000 : 100);
        if (res.destroyed) return;
      }
    }
    res.end("data: [DONE]\n\n");
    finishedAt = Date.now();
  });
  server.on("connection", (s) => {
    sockets.add(s);
    s.on("close", () => sockets.delete(s));
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    bodies,
    finishedAt: () => finishedAt,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close() {
      sockets.forEach((s) => s.destroy());
      server.close();
    }
  };
}

const think = (url: string, jsonMode = false) =>
  new OpenAiCompatibleThink({ baseUrl: url, apiKey: "k" }, "m", {
    temperature: 0,
    maxTokens: 50,
    jsonMode
  });

const user = [{ role: "user" as const, content: "Hi" }];

/** How each LLM feature is verified; a declared feature without a check fails the suite. */
const FEATURES: Record<string, () => Promise<void>> = {
  async streaming() {
    const v = await standIn(() => ({ text: "one two three" }));
    try {
      let firstAt = 0;
      const text: string[] = [];
      for await (const c of think(v.url).stream(
        user,
        [],
        new AbortController().signal
      )) {
        firstAt ||= Date.now();
        if (c.type === "text") text.push(c.text);
      }
      expect(text.join("")).to.equal("one two three ");
      expect(firstAt).to.be.lessThan(v.finishedAt());
    } finally {
      v.close();
    }
  },
  async "tool-calling"() {
    const v = await standIn(() => ({ toolCall: "lookup" }));
    try {
      const chunks: ThinkChunk[] = [];
      for await (const c of think(v.url).stream(
        user,
        [{ name: "lookup", description: "d", parameters: { type: "object" } }],
        new AbortController().signal
      ))
        chunks.push(c);
      expect(v.bodies[0].tools).to.deep.equal([
        {
          type: "function",
          function: {
            name: "lookup",
            description: "d",
            parameters: { type: "object" }
          }
        }
      ]);
      expect(chunks).to.deep.equal([
        {
          type: "tool_calls",
          calls: [{ id: "c1", name: "lookup", arguments: '{"a":1}' }]
        }
      ]);
    } finally {
      v.close();
    }
  },
  async "json-mode"() {
    const v = await standIn(() => ({ text: '{"ok":true}' }));
    try {
      for await (const _ of think(v.url, true).stream(
        user,
        [],
        new AbortController().signal
      ))
        void _;
      expect(v.bodies[0].response_format).to.deep.equal({
        type: "json_object"
      });
    } finally {
      v.close();
    }
  }
};

type SeedEntry = {
  kind: string;
  id: string;
  type?: string;
  adapter?: string;
  features?: string[];
};

describe("@autopilot LLM adapter conformance (registry 1.5)", function () {
  this.timeout(20000);
  const entries = (
    parse(fs.readFileSync(SEED, "utf8")) as { entries: SeedEntry[] }
  ).entries;
  const adapterOf = new Map(
    entries.filter((e) => e.kind === "provider").map((e) => [e.id, e.adapter!])
  );
  const llms = entries.filter((e) => e.kind === "model" && e.type === "llm");

  it("finds the language models the catalog seed declares", function () {
    expect(llms.length).to.be.greaterThan(0);
  });

  for (const m of llms) {
    const adapter = adapterOf.get(m.id.split("/")[0])!;
    describe(`${m.id} (${adapter})`, function () {
      it("has a built-in adapter", function () {
        expect(Object.keys(OPENAI_COMPATIBLE)).to.include(adapter);
      });
      for (const feature of m.features ?? [])
        it(`verifies declared feature ${feature}`, async function () {
          expect(
            FEATURES[feature],
            `no conformance check for llm feature ${feature}`
          ).to.be.a("function");
          await FEATURES[feature]();
        });
    });
  }

  it("cancels fast: aborting stops the stream within 200 ms", async function () {
    const v = await standIn(() => ({ text: "a b c", slow: true }));
    try {
      const ctl = new AbortController();
      const it = think(v.url)
        .stream(user, [], ctl.signal)
        [Symbol.asyncIterator]();
      await it.next(); // the first word
      const pending = it.next().catch((e) => e);
      const at = Date.now();
      ctl.abort();
      const r = await pending;
      expect(Date.now() - at).to.be.lessThan(200);
      // An abort is not a provider error.
      expect(r).to.not.be.instanceOf(ThinkError);
    } finally {
      v.close();
    }
  });

  it("maps vendor errors to provider_unavailable (and rejected requests to bad_message)", async function () {
    for (const [status, code] of [
      [503, "provider_unavailable"],
      [429, "provider_unavailable"],
      [401, "provider_unavailable"],
      [400, "bad_message"]
    ] as const) {
      const v = await standIn(() => ({ status }));
      try {
        const e = await (async () => {
          for await (const _ of think(v.url).stream(
            user,
            [],
            new AbortController().signal
          ))
            void _;
        })().catch((x) => x);
        expect(e, String(status)).to.be.instanceOf(ThinkError);
        expect(e.code, String(status)).to.equal(code);
      } finally {
        v.close();
      }
    }
    const e = await (async () => {
      for await (const _ of think("http://127.0.0.1:9").stream(
        user,
        [],
        new AbortController().signal
      ))
        void _;
    })().catch((x) => x);
    expect(e).to.be.instanceOf(ThinkError);
    expect(e.code).to.equal("provider_unavailable");
  });
});
