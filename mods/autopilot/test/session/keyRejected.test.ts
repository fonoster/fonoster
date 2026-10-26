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
import { Registry } from "@fonoster/common";
import { ProviderAuthError } from "@fonoster/community";
import { MeteredEmbeddings } from "../../src/knowledge/MeteredEmbeddings";
import {
  Agent,
  AgentEvent,
  RegistryLlmResolver,
  sessionAgentSchema
} from "../../src/session";

// A language model that rejects the key fails the call at once (#1146), whether the rejected
// request was the reply itself or one prepared early on turn.likely_ended and then discarded.

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function setup(rejection: unknown, settings: Record<string, unknown> = {}) {
  const said: string[] = [];
  const hangups: unknown[] = [];
  const events: AgentEvent[] = [];
  let requests = 0;
  const session = {
    callRef: "call-1",
    subscribe: async () => undefined,
    listen: async () => undefined,
    say: async (text: string | AsyncIterable<string>) => {
      if (typeof text === "string") said.push(text);
      else for await (const piece of text) said.push(piece);
      return { interrupted: false, heardText: "", heardMs: 0 };
    },
    play: async () => ({ interrupted: false, heardMs: 0 }),
    hangup: async (options?: unknown) => {
      hangups.push(options);
    }
  };
  const think = {
    // eslint-disable-next-line require-yield
    async *stream() {
      requests++;
      throw rejection;
    }
  };
  const agent = new Agent(
    session as never,
    sessionAgentSchema.parse({
      conversationSettings: {
        systemPrompt: "p",
        goodbyeMessage: "bye",
        systemErrorMessage: "err",
        ...settings
      },
      languageModel: { model: "openai/gpt-4o-mini" }
    }),
    think as never,
    {} as never,
    { turn: () => undefined, note: () => undefined }
  );
  agent.send = (e) => events.push(e);
  return {
    agent,
    said,
    hangups,
    events,
    requests: () => requests
  };
}

const failure = {
  failure: { reason: "provider_auth_failed", provider: "together", kind: "llm" }
};

describe("@autopilot/session a rejected language model key", function () {
  it("hangs up at once when a reply prepared early is rejected, even if it is discarded", async function () {
    const t = setup(new ProviderAuthError("together", "llm", 401));
    t.agent.prepare("What are your hours?");
    await sleep(20);
    expect(t.hangups).to.deep.equal([failure]);
    // The caller kept talking: the prepared reply is dropped, the call still fails...
    t.agent.resumed();
    // ...and the next turn asks the model nothing and says no error message.
    await t.agent.answer("What are your hours on Sunday?");
    await sleep(20);
    expect(t.requests()).to.equal(1);
    expect(t.hangups).to.have.length(1);
    expect(t.said.join(" ")).to.not.include("err");
  });

  it("hangs up once when the prepared reply is adopted by the turn", async function () {
    const t = setup(new ProviderAuthError("together", "llm", 401));
    t.agent.prepare("Hi");
    await t.agent.answer("Hi");
    await sleep(20);
    expect(t.requests()).to.equal(1);
    expect(t.hangups).to.deep.equal([failure]);
    expect(t.said).to.deep.equal([]);
  });

  it("knows the error by its shape, as one from another copy of @fonoster/community", async function () {
    const foreign = Object.assign(
      new Error("together rejected the credentials"),
      {
        code: "provider_unavailable",
        reason: "provider_auth_failed",
        provider: "together",
        kind: "llm",
        status: 401
      }
    );
    const t = setup(foreign);
    await t.agent.answer("Hi");
    await sleep(20);
    expect(t.hangups).to.deep.equal([failure]);
    expect(t.said.join(" ")).to.not.include("err");
  });

  it("stops the idle and max-duration timers like any ending", async function () {
    const t = setup(new ProviderAuthError("together", "llm", 401), {
      maxSessionDuration: 80,
      idleOptions: { message: "Still there?", timeout: 60 }
    });
    await t.agent.greet();
    t.agent.armIdle();
    await t.agent.answer("Hi");
    await sleep(150);
    expect(t.hangups).to.deep.equal([failure]);
    expect(t.events.map((e) => e.type)).to.not.include.members([
      "IDLE",
      "MAX_DURATION"
    ]);
  });

  it("speaks the error message for a failure that is not a rejected key", async function () {
    const t = setup(new Error("boom"));
    await t.agent.answer("Hi");
    expect(t.said).to.deep.equal(["err"]);
    expect(t.hangups).to.deep.equal([]);
  });
});

// Knowledge is optional, so a rejected embeddings key is not fatal: the call goes on without
// knowledge, the rejection is reported once, and the vendor is not asked again for the call.
describe("@autopilot/session a rejected embeddings key", function () {
  let server: http.Server;
  let url: string;
  let requests = 0;

  before(async () => {
    server = http.createServer((req, res) => {
      requests++;
      req.resume();
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: { message: "Invalid API key" } }));
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());

  it("reports the rejection once and stops asking", async function () {
    const rejected: unknown[] = [];
    const e = new MeteredEmbeddings({
      apiKey: "bad",
      keySource: "workspace",
      baseUrl: url,
      sink: {
        usage: () => undefined,
        missing: () => undefined,
        keyRejected: (event) => rejected.push(event)
      }
    });
    for (let i = 0; i < 3; i++)
      expect(
        await e.embedQuery("q").then(
          () => undefined,
          (err: Error) => err.message
        )
      ).to.equal("embeddings rejected the credentials (HTTP 401)");
    expect(requests).to.equal(1);
    expect(rejected).to.deep.equal([
      {
        provider: "openai",
        catalogId: "openai/text-embedding-ada-002",
        status: 401
      }
    ]);
  });
});

// A registry provider served by another adapter (together through openai) names itself in the
// error, so the record and the dashboard point at the key the customer saved.
describe("@autopilot/session a rejected key from a registry provider", function () {
  it("names the catalog provider, not its adapter", async function () {
    const server = http.createServer((req, res) => {
      req.resume();
      res.writeHead(401).end();
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    try {
      const registry = new Registry.Registry({
        store: new Registry.MemoryRegistryStore()
      });
      registry.addProvider({
        id: "together",
        adapter: "openai",
        capabilities: ["llm"],
        credentialRef: "together",
        endpoints: {
          llm: `http://127.0.0.1:${(server.address() as AddressInfo).port}`
        }
      });
      registry.addModel({
        id: "together/llama",
        type: "llm",
        features: ["streaming"]
      });
      const { think } = await new RegistryLlmResolver({
        registry,
        credentials: { get: () => "bad" }
      }).resolve("together/llama", { temperature: 0, maxTokens: 10 });
      const error = await (async () => {
        for await (const _ of think.stream(
          [{ role: "user", content: "Hi" }],
          [],
          new AbortController().signal
        ))
          void _;
      })().catch((e) => e);
      expect(error).to.include({
        provider: "together",
        kind: "llm",
        reason: "provider_auth_failed"
      });
    } finally {
      server.close();
    }
  });
});
