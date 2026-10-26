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
import {
  FakeAppBridge,
  FakesHarness,
  Scenario,
  runScenario
} from "@fonoster/conformance";
import { VoiceServer } from "@fonoster/voice";
import { parse } from "yaml";
import {
  TurnTrace,
  createAutopilotHandler,
  resolveThink,
  sentences,
  sessionAgentSchema,
  KnowledgePort
} from "../../src/session";

const base = {
  conversationSettings: {
    systemPrompt: "p",
    goodbyeMessage: "bye",
    systemErrorMessage: "err"
  },
  languageModel: { model: "openai/gpt-4o-mini" }
};

async function collect(it: AsyncIterable<string>) {
  const out: string[] = [];
  for await (const s of it) out.push(s);
  return out;
}

async function* tokens(list: string[]) {
  for (const t of list) yield t;
}

describe("@autopilot/session config", function () {
  it("accepts a catalog id and fills defaults", function () {
    const a = sessionAgentSchema.parse(base);
    expect(a.languageModel.temperature).to.equal(0.4);
    expect(a.conversationSettings.allowUserBargeIn).to.equal(true);
  });

  it("rejects vendor enums and VAD settings", function () {
    const withProvider = {
      ...base,
      languageModel: { ...base.languageModel, provider: "openai" }
    };
    expect(sessionAgentSchema.safeParse(withProvider).success).to.equal(false);
    const withVad = {
      ...base,
      conversationSettings: { ...base.conversationSettings, vad: {} }
    };
    expect(
      JSON.stringify(sessionAgentSchema.safeParse(withVad).error?.issues)
    ).to.contain("AppBridge");
  });
});

describe("@autopilot/session think", function () {
  it("resolves a catalog id to its provider", function () {
    expect(
      resolveThink(
        "openai/gpt-4o-mini",
        { openai: { baseUrl: "https://api.openai.com" } },
        { temperature: 0, maxTokens: 1 }
      )
    ).to.exist;
    expect(() =>
      resolveThink("acme/x", {}, { temperature: 0, maxTokens: 1 })
    ).to.throw('no language model provider "acme"');
  });

  it("groups tokens into sentences", async function () {
    expect(
      await collect(
        sentences(tokens(["Sure", ". We ", "open at nine", ". Bye"]))
      )
    ).to.deep.equal(["Sure. ", "We open at nine. ", "Bye"]);
  });
});

describe("@autopilot/session call record traces", function () {
  it("records a normal and an interrupted turn with heard text and timings", async function () {
    const traces: TurnTrace[] = [];
    const harness = await new FakesHarness().start();
    const server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: "s"
    }).listen(
      createAutopilotHandler({
        agent: { ...base, languageModel: { model: "fake/llm" } },
        providers: { fake: { baseUrl: harness.llm.url } },
        recorder: { turn: (t) => traces.push(t), note: () => undefined }
      })
    );
    const scenario: Scenario = parse(`
format: fonoster.scenario.v1
name: traces
contract: autopilot
role: appbridge
setup:
  providers:
    llm: { script: [{ content: "One. Two." }, { content: "Three. Four." }] }
steps:
  - send: { type: session.start, protocol: fonoster.session.v1, sessionRef: s, callRef: c, appRef: a, direction: inbound, from: "1", to: "2", metadata: {}, handoff: null, audio: { codec: pcm16, rate: 16000 }, tracks: [], speech: { voice: v, language: en } }
  - send: { type: turn.ended, text: "first", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, last: true }
    capture: { r1: id }
  - send: { type: output.done, id: "\${r1}" }
  - send: { type: turn.ended, text: "second", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, text: "Three. ", last: false }
    capture: { r2: id }
  - send: { type: output.interrupted, id: "\${r2}", heardText: "Three.", heardMs: 400 }
  - wait: { ms: 100 }
`);
    try {
      const result = await runScenario(scenario, {
        harness,
        connect: () =>
          new FakeAppBridge({ signingSecret: "s" }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      expect(result.status, result.reason).to.equal("passed");
      expect(traces).to.have.length(2);
      expect(traces[0]).to.include({
        userText: "first",
        replyText: "One. Two.",
        heardText: "One. Two.",
        interrupted: false
      });
      expect(traces[1]).to.include({
        userText: "second",
        heardText: "Three.",
        interrupted: true
      });
      expect(traces[0].firstTokenMs).to.be.a("number");
      expect(traces[0].firstSpeakMs).to.be.a("number");
    } finally {
      await server.close();
      await harness.stop();
    }
  });
});

describe("@autopilot/session turn stages", function () {
  this.timeout(10000);

  it("splits a finished answer's wait into LLM and text-to-speech time", async function () {
    const traces: TurnTrace[] = [];
    const harness = await new FakesHarness().start();
    const server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: "s"
    }).listen(
      createAutopilotHandler({
        agent: { ...base, languageModel: { model: "fake/llm" } },
        providers: { fake: { baseUrl: harness.llm.url } },
        recorder: { turn: (t) => traces.push(t), note: () => undefined }
      })
    );
    // The model takes 300 ms; the first audio starts 200 ms after the sentence is handed over;
    // the second answer is cut off, so it has no stages.
    const scenario: Scenario = parse(`
format: fonoster.scenario.v1
name: stages
contract: autopilot
role: appbridge
setup:
  providers:
    llm: { delayMs: 300, script: [{ content: "One." }, { content: "Two. Three." }] }
steps:
  - send: { type: session.start, protocol: fonoster.session.v1, sessionRef: s, callRef: c, appRef: a, direction: inbound, from: "1", to: "2", metadata: {}, handoff: null, audio: { codec: pcm16, rate: 16000 }, tracks: [], speech: { voice: v, language: en } }
  - send: { type: turn.ended, text: "first", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, last: false }
    capture: { r1: id }
  - wait: { ms: 200 }
  - send: { type: output.started, id: "\${r1}" }
  - wait: { ms: 100 }
  - send: { type: output.done, id: "\${r1}" }
  - send: { type: turn.ended, text: "second", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, text: "Two. ", last: false }
    capture: { r2: id }
  - send: { type: output.started, id: "\${r2}" }
  - send: { type: output.interrupted, id: "\${r2}", heardText: "Two.", heardMs: 400 }
  - wait: { ms: 100 }
`);
    try {
      const result = await runScenario(scenario, {
        harness,
        connect: () =>
          new FakeAppBridge({ signingSecret: "s" }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      expect(result.status, result.reason).to.equal("passed");
      expect(traces).to.have.length(2);
      const [answered, cut] = traces;
      // The scripted delays are floors; the upper bounds stay loose so a slow CI box does not flake.
      expect(answered.llmMs).to.be.within(280, 5000);
      expect(answered.llmMs).to.equal(answered.firstSpeakMs);
      expect(answered.ttsMs).to.be.within(180, 5000);
      expect(cut.llmMs).to.equal(undefined);
      expect(cut.ttsMs).to.equal(undefined);
    } finally {
      await server.close();
      await harness.stop();
    }
  });
  it("leaves the stages out when a tool's start message played before the reply", async function () {
    const traces: TurnTrace[] = [];
    const harness = await new FakesHarness().start();
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
                name: "lookup",
                description: "d",
                parameters: { type: "object", properties: {} },
                requestStartMessage: "One moment.",
                operation: { method: "get", url: "https://example.com/" }
              }
            ]
          }
        },
        providers: { fake: { baseUrl: harness.llm.url } },
        tools: { run: async () => ({ ok: true, result: {} }) },
        recorder: { turn: (t) => traces.push(t), note: () => undefined }
      } as Parameters<typeof createAutopilotHandler>[0])
    );
    const scenario: Scenario = parse(`
format: fonoster.scenario.v1
name: stages-after-start-message
contract: autopilot
role: appbridge
setup:
  providers:
    llm: { script: [{ tool_calls: [{ name: lookup, arguments: {} }] }, { content: "Found it." }] }
steps:
  - send: { type: session.start, protocol: fonoster.session.v1, sessionRef: s, callRef: c, appRef: a, direction: inbound, from: "1", to: "2", metadata: {}, handoff: null, audio: { codec: pcm16, rate: 16000 }, tracks: [], speech: { voice: v, language: en } }
  - send: { type: turn.ended, text: "find it", language: en, confidence: 1, durationMs: 1 }
  - expect: { type: speak, text: "One moment.", last: true }
    capture: { m: id }
  - send: { type: output.started, id: "\${m}" }
  - expect: { type: speak, text: "Found it.", last: false }
    capture: { r: id }
  - send: { type: output.done, id: "\${m}" }
  - send: { type: output.started, id: "\${r}" }
  - send: { type: output.done, id: "\${r}" }
  - wait: { ms: 100 }
`);
    try {
      const result = await runScenario(scenario, {
        harness,
        connect: () =>
          new FakeAppBridge({ signingSecret: "s" }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      expect(result.status, result.reason).to.equal("passed");
      expect(traces).to.have.length(1);
      expect(traces[0].firstSpeakMs).to.be.a("number");
      expect(traces[0].llmMs).to.equal(undefined);
      expect(traces[0].ttsMs).to.equal(undefined);
    } finally {
      await server.close();
      await harness.stop();
    }
  });
});

describe("@autopilot/session knowledge port", function () {
  this.timeout(10000);

  async function run(knowledge: KnowledgePort, turns: string[]) {
    const harness = await new FakesHarness().start();
    harness.llm.configure({
      script: turns.map((_, i) => ({ content: `Reply ${i + 1}.` }))
    });
    const server = await new VoiceServer({
      port: 0,
      host: "127.0.0.1",
      signingSecret: "s"
    }).listen(
      createAutopilotHandler({
        agent: { ...base, languageModel: { model: "fake/llm" } },
        providers: { fake: { baseUrl: harness.llm.url } },
        knowledge
      })
    );
    const steps = turns
      .map(
        (t, i) => `
  - send: { type: turn.ended, text: "${t}", language: en, confidence: 1, durationMs: 1 }
    label: t${i}
  - expect: { type: speak, last: true }
    capture: { r${i}: id }
  - send: { type: output.done, id: "\${r${i}}" }`
      )
      .join("");
    const scenario: Scenario = parse(`
format: fonoster.scenario.v1
name: knowledge
contract: autopilot
role: appbridge
steps:
  - send: { type: session.start, protocol: fonoster.session.v1, sessionRef: s, callRef: c, appRef: a, direction: inbound, from: "1", to: "2", metadata: {}, handoff: null, audio: { codec: pcm16, rate: 16000 }, tracks: [], speech: { voice: v, language: en } }${steps}
  - wait: { ms: 50 }
`);
    try {
      const started = Date.now();
      const result = await runScenario(scenario, {
        connect: () =>
          new FakeAppBridge({ signingSecret: "s" }).dial(
            `ws://127.0.0.1:${server.port}/`
          )
      });
      return {
        result,
        conversations: harness.llm.conversations,
        ms: Date.now() - started
      };
    } finally {
      await server.close();
      await harness.stop();
    }
  }

  it("gives the LLM what the knowledge port finds, for that request only", async function () {
    const { result, conversations } = await run(
      {
        find: async (q) =>
          q.includes("hours") ? "Open 9 to 5, Monday to Friday." : ""
      },
      ["What are your hours?", "Thanks"]
    );
    expect(result.status, result.reason).to.equal("passed");
    expect(conversations[0].messages[1]).to.deep.equal({
      role: "system",
      content: "Relevant information:\nOpen 9 to 5, Monday to Friday."
    });
    // The second request has no knowledge (nothing found) and the first one's is not in history.
    expect(
      conversations[1].messages.filter((m) =>
        String(m.content).startsWith("Relevant information")
      )
    ).to.have.length(0);
  });

  it("gives the LLM the passages' text, each capped (#1067)", async function () {
    const long = "a".repeat(1500);
    const { result, conversations } = await run(
      {
        find: async () => "unused",
        search: async () => [
          { text: long, source: "a.pdf", score: 0.9 },
          { text: "Closed on holidays.", source: "b.pdf", score: 0.5 }
        ]
      },
      ["What are your hours?"]
    );
    expect(result.status, result.reason).to.equal("passed");
    expect(conversations[0].messages[1]).to.deep.equal({
      role: "system",
      content: `Relevant information:\n${"a".repeat(1000)}…\nClosed on holidays.`
    });
  });

  it("does not wait for a slow knowledge lookup", async function () {
    const slow: KnowledgePort = {
      find: () => new Promise((r) => setTimeout(() => r("late"), 3000))
    };
    const { result, conversations, ms } = await run(slow, ["Hello?"]);
    expect(result.status, result.reason).to.equal("passed");
    expect(ms).to.be.lessThan(2500);
    expect(
      conversations[0].messages.some(
        (m) => m.content === "Relevant information:\nlate"
      )
    ).to.equal(false);
  });
});
