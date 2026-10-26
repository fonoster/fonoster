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
import http from "node:http";
import { AddressInfo } from "node:net";
import {
  FakeAppBridge,
  FakesHarness,
  Scenario,
  runScenario
} from "@fonoster/conformance";
import { VoiceServer } from "@fonoster/voice";
import { Document } from "@langchain/core/documents";
import { SyntheticEmbeddings } from "@langchain/core/utils/testing";
import { parse } from "yaml";
import { AbstractKnowledgeBase } from "../../src/knowledge/AbstractKnowledgeBase";
import { MAX_PROMPT_PASSAGE_TEXT, passagesText } from "../../src/knowledge";
import {
  TurnTrace,
  capText,
  createAutopilotHandler,
  fromKnowledgeBase,
  knowledgeSearchTrace,
  loggedTurn,
  toolCallTrace
} from "../../src/session";
import {
  KnowledgePort,
  MAX_KNOWLEDGE_TEXT,
  MAX_TOOL_TEXT
} from "../../src/session";
import { HttpToolPort } from "../../src/session/tools";

// RV-B2: tool URLs are tenant input; the platform's own network is off limits.
describe("@autopilot/session HttpToolPort destinations", function () {
  let server: http.Server;
  let url: string;
  let hits = 0;

  before(async () => {
    server = http.createServer((_req, res) => {
      hits++;
      res.writeHead(200, { "content-type": "application/json" });
      res.end('{"open":"9"}');
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}/hours`;
  });
  after(() => server.close());

  const tool = (u: string) => ({
    name: "getHours",
    description: "Opening hours",
    parameters: { type: "object", properties: {} },
    operation: { method: "get", url: u }
  });

  it("[APT-017] refuses private and metadata destinations", async function () {
    for (const u of [
      url,
      "http://169.254.169.254/latest/meta-data",
      "http://redis:6379/"
    ]) {
      const port = new HttpToolPort([tool(u)] as never, { allow: [] });
      const out = await port.run("getHours", {}, new AbortController().signal);
      expect(out.ok, u).to.equal(false);
      expect(out.error, u).to.match(/non-public|internal name/);
    }
    expect(hits).to.equal(0);
  });

  it("[APT-017] calls a destination the operator allowed", async function () {
    const port = new HttpToolPort([tool(url)] as never, {
      allow: ["127.0.0.1"]
    });
    const out = await port.run("getHours", {}, new AbortController().signal);
    expect(out).to.deep.equal({
      ok: true,
      result: { open: "9" },
      method: "GET",
      status: 200
    });
  });

  it("[APT-022] an invalid tool URL is a failed call, not a failed reply", async function () {
    const port = new HttpToolPort([tool("not a url?key=url-secret")] as never);
    const out = await port.run("getHours", {}, new AbortController().signal);
    expect(out).to.include({ ok: false, method: "GET" });
    expect(out.error).to.be.a("string");
    expect(out.error).to.not.contain("url-secret");
  });
});

// #1067: the call record shows each tool call and knowledge search, capped and without secrets.
describe("@autopilot/session tool and knowledge details in the turn trace", function () {
  this.timeout(10000);

  const base = {
    conversationSettings: {
      systemPrompt: "p",
      goodbyeMessage: "bye",
      systemErrorMessage: "err"
    }
  };

  async function call(options: {
    knowledge?: KnowledgePort;
    tool?: string;
    script: unknown[];
  }) {
    const traces: TurnTrace[] = [];
    const harness = await new FakesHarness().start();
    harness.llm.configure({ script: options.script as never });
    const server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: "s"
    }).listen(
      createAutopilotHandler({
        agent: {
          ...base,
          languageModel: {
            model: "fake/llm",
            tools: [
              {
                name: "getHours",
                description: "Opening hours",
                parameters: { type: "object", properties: {} },
                operation: {
                  method: "post",
                  url: `${harness.mediaUrl}/tool/${options.tool ?? "hours"}?key=url-secret`,
                  headers: { authorization: "Bearer header-secret" }
                }
              }
            ]
          }
        },
        providers: { fake: { baseUrl: harness.llm.url } },
        allowedDestinations: ["127.0.0.1"],
        knowledge: options.knowledge,
        recorder: { turn: (t) => traces.push(t), note: () => undefined }
      })
    );
    const scenario: Scenario = parse(`
format: fonoster.scenario.v1
name: details
contract: autopilot
role: appbridge
steps:
  - send: { type: session.start, protocol: fonoster.session.v1, sessionRef: s, callRef: c, appRef: a, direction: inbound, from: "1", to: "2", metadata: {}, handoff: null, audio: { codec: pcm16, rate: 16000 }, tracks: [], speech: { voice: v, language: en } }
  - send: { type: turn.ended, text: "When are you open on monday?", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, last: true }
    within_ms: 3000
    capture: { r1: id }
  - send: { type: output.done, id: "\${r1}" }
  - wait: { ms: 50 }
`);
    try {
      const result = await runScenario(scenario, {
        connect: () =>
          new FakeAppBridge({ signingSecret: "s" }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      expect(result.status, result.reason).to.equal("passed");
      return traces;
    } finally {
      await server.close();
      await harness.stop();
    }
  }

  it("[APT-022] records a tool's method, status, time, parameters and response, never its URL or headers", async function () {
    const traces = await call({
      script: [
        { tool_calls: [{ name: "getHours", arguments: { day: "monday" } }] },
        { content: "We open at 9." }
      ]
    });
    expect(traces).to.have.length(1);
    const [tool] = traces[0].toolCalls;
    expect(tool).to.include({
      name: "getHours",
      ok: true,
      method: "POST",
      status: 200,
      parameters: '{"day":"monday"}',
      response: '{"open":"9"}'
    });
    expect(tool.durationMs).to.be.a("number");
    expect(tool.startedAtMs).to.be.within(Date.now() - 10000, Date.now());
    const recorded = JSON.stringify(traces);
    expect(recorded).to.not.contain("secret");
    expect(recorded).to.not.contain("/tool/");
  });

  it("[APT-022] records a failed tool's status and error", async function () {
    const traces = await call({
      tool: "error",
      script: [
        { tool_calls: [{ name: "getHours", arguments: {} }] },
        { content: "Sorry." }
      ]
    });
    const [tool] = traces[0].toolCalls;
    expect(tool).to.include({ ok: false, method: "POST", status: 500 });
    expect(tool.error).to.contain("HTTP 500");
    expect(tool).to.not.have.property("parameters");
    expect(tool).to.not.have.property("response");
  });

  it("[APT-022] records the knowledge search: query, top passages with their document, and time", async function () {
    const traces = await call({
      knowledge: {
        find: async () => "unused",
        search: async () => [
          { text: "Open 9 to 5.", source: "hours.pdf", score: 0.91 },
          { text: "Closed on holidays.", source: "hours.pdf", score: 0.8 },
          { text: "Parking in the back.", source: "visit.pdf", score: 0.5 },
          { text: "A fourth passage.", source: "visit.pdf", score: 0.1 }
        ]
      },
      script: [{ content: "We open at 9." }]
    });
    const [search] = traces[0].knowledgeSearches!;
    expect(search.query).to.equal("When are you open on monday?");
    expect(search).to.not.have.property("source");
    expect(search.passages[0].source).to.equal("hours.pdf");
    expect(search.startedAtMs).to.be.within(Date.now() - 10000, Date.now());
    expect(search.passages.map((p) => p.text)).to.deep.equal([
      "Open 9 to 5.",
      "Closed on holidays.",
      "Parking in the back."
    ]);
    expect(search.passages[0].score).to.equal(0.91);
    expect(search.durationMs).to.be.a("number");
    expect(search).to.not.have.property("timedOut");
    expect(search).to.not.have.property("failed");
  });

  it("[APT-022] records a knowledge search that failed, with a short error and no stack", async function () {
    const traces = await call({
      knowledge: {
        find: async () => "unused",
        search: async () => {
          throw new Error(`vector store down ${"x".repeat(1000)}`);
        }
      },
      script: [{ content: "Hello." }]
    });
    const [search] = traces[0].knowledgeSearches!;
    expect(search).to.deep.include({
      query: "When are you open on monday?",
      passages: [],
      failed: true
    });
    expect(search.error).to.match(/^vector store down x+…$/);
    expect(search.error!.length).to.be.at.most(201);
    expect(search.error).to.not.contain(" at ");
  });

  it("[APT-022] records a knowledge search the reply didn't wait for", async function () {
    const traces = await call({
      knowledge: {
        find: () => new Promise((r) => setTimeout(() => r("late"), 3000))
      },
      script: [{ content: "Hello." }]
    });
    expect(traces[0].knowledgeSearches![0]).to.deep.include({
      passages: [],
      timedOut: true
    });
  });

  it("[APT-022] caps parameters, responses and passages without leaving part of a number", function () {
    const card = "4111 1111 1111 1111";
    const long = `${"x".repeat(MAX_TOOL_TEXT - 8)} ${card}`;
    const capped = capText(long, MAX_TOOL_TEXT);
    expect(capped.length).to.be.at.most(MAX_TOOL_TEXT + 1);
    expect(capped.endsWith("x…")).to.equal(true);
    // A card number spoken as words, cut part way, goes too.
    const spoken = `card ${"four one one one ".repeat(4).trim()}`;
    expect(capText(spoken, 30)).to.equal("card…");
    expect(capText("short", 10)).to.equal("short");
    // Amounts and ordinary words at the cut stay: they can't be part of a card number.
    expect(capText("you owe 42 dollars", 10)).to.equal("you owe 42…");
    expect(capText("amount: 1,250.00 USD", 16)).to.equal("amount: 1,250.00…");
    expect(capText("oh one more thing", 6)).to.equal("oh one…");

    const trace = toolCallTrace(
      "lookup",
      { note: "y".repeat(5000) },
      { ok: true, result: { body: "z".repeat(5000) }, method: "GET" },
      Date.now(),
      12
    );
    expect(trace.parameters!.length).to.be.at.most(MAX_TOOL_TEXT + 1);
    expect(trace.response!.length).to.be.at.most(MAX_TOOL_TEXT + 1);
    const search = knowledgeSearchTrace(
      "q",
      { passages: [{ text: "p".repeat(2000), source: "a.pdf" }] },
      Date.now(),
      5
    );
    expect(search.passages[0].text.length).to.be.at.most(
      MAX_KNOWLEDGE_TEXT + 1
    );
  });

  it("[APT-022] the knowledge base returns passages with their document and score", async function () {
    class TestKnowledgeBase extends AbstractKnowledgeBase {
      async getLoaders() {
        return [
          {
            load: async () => [
              new Document({
                pageContent: "Open 9 to 5.",
                metadata: { source: "/tmp/s3/hours.pdf" }
              })
            ]
          }
        ];
      }
    }
    const kb = new TestKnowledgeBase({
      embeddings: new SyntheticEmbeddings({ vectorSize: 8 })
    });
    await kb.load();
    expect(await kb.queryKnowledgeBase("hours")).to.equal("Open 9 to 5.");
    const [passage] = await kb.searchKnowledgeBase("hours");
    expect(passage).to.include({ text: "Open 9 to 5.", source: "hours.pdf" });
    expect(passage.score).to.be.a("number");
    // The hosted port hands the passages through.
    const port = fromKnowledgeBase(kb);
    expect(
      await port.search!("hours", new AbortController().signal)
    ).to.deep.equal([passage]);
  });

  it("[APT-022] the model sees each passage's text, capped", async function () {
    const long = "a".repeat(MAX_PROMPT_PASSAGE_TEXT + 500);
    expect(
      passagesText([{ text: long }, { text: "Closed on holidays." }])
    ).to.equal(`${"a".repeat(MAX_PROMPT_PASSAGE_TEXT)}…\nClosed on holidays.`);
    // The legacy path (queryKnowledgeBase, used by createChain) is capped the same way.
    class LongKnowledgeBase extends AbstractKnowledgeBase {
      async getLoaders() {
        return [];
      }
      async searchKnowledgeBase() {
        return [{ text: long, source: "a.pdf", score: 1 }];
      }
    }
    const kb = new LongKnowledgeBase({
      embeddings: new SyntheticEmbeddings({ vectorSize: 8 })
    });
    expect(await kb.queryKnowledgeBase("q")).to.equal(
      `${"a".repeat(MAX_PROMPT_PASSAGE_TEXT)}…`
    );
  });

  it("[APT-022] without a call record, the log has no tool payloads or knowledge queries", function () {
    const logged = JSON.stringify(
      loggedTurn({
        userText: "hi",
        toolCalls: [
          toolCallTrace(
            "charge",
            { card: "param-secret" },
            { ok: false, error: "error-secret", status: 402, method: "POST" },
            Date.now(),
            30
          ),
          toolCallTrace(
            "lookup",
            {},
            { ok: true, result: "response-secret" },
            Date.now(),
            5
          )
        ],
        knowledgeSearches: [
          knowledgeSearchTrace(
            "query-secret",
            { passages: [{ text: "passage-secret", source: "doc-secret" }] },
            Date.now(),
            7
          ),
          knowledgeSearchTrace(
            "q2-secret",
            { error: new Error("err-secret") },
            Date.now(),
            3
          )
        ]
      })
    );
    expect(logged).to.not.contain("secret");
    expect(JSON.parse(logged)).to.deep.include({
      toolCalls: [
        { name: "charge", ok: false, status: 402, durationMs: 30 },
        { name: "lookup", ok: true, durationMs: 5 }
      ],
      knowledgeSearches: [
        { passages: 1, durationMs: 7 },
        { passages: 0, durationMs: 3, failed: true }
      ]
    });
  });
});
