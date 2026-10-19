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
import { sessionAgentSchema } from "@fonoster/common";
import { FakesHarness } from "@fonoster/conformance";
import { ProviderBehavior } from "@fonoster/conformance/dist/scenario/types";
import { StepEvaluationReport } from "@fonoster/types";
import {
  SessionScenarioReport,
  runSessionEval,
  sessionThinkFor
} from "../../src/models/evaluations/session";
import { resolveThink } from "../../src/session";

// Conversation evals through the session engine (rework-autopilot 1.4): fake session + FakeLlm,
// no vendor calls.

const scenario = (conversation: unknown[], ref = "s1") => ({
  ref,
  description: ref,
  telephonyContext: {
    callDirection: "FROM_PSTN",
    ingressNumber: "+15550001",
    callerNumber: "+15550002"
  },
  conversation
});

const step = (
  userInput: string,
  response: string,
  type: "EXACT" | "SIMILAR" = "EXACT",
  tools?: unknown[]
) => ({
  userInput,
  expected: { text: { type, response }, ...(tools ? { tools } : {}) }
});

function agentWith(scenarios: unknown[], extra: object = {}) {
  return sessionAgentSchema.parse({
    conversationSettings: {
      firstMessage: "Hello, how can I help?",
      systemPrompt: "You are a receptionist.",
      goodbyeMessage: "Goodbye!",
      systemErrorMessage: "Sorry, something went wrong.",
      ...extra
    },
    languageModel: {
      model: "fake/llm",
      tools: [
        {
          name: "getWeather",
          description: "Weather for a city",
          parameters: {
            type: "object",
            properties: { city: { type: "string" } },
            required: ["city"]
          },
          operation: { method: "get", url: "https://tools.example.com/weather" }
        }
      ]
    },
    testCases: {
      evalsLanguageModel: { provider: "openai", model: "gpt-4o-mini" },
      scenarios
    }
  });
}

describe("@autopilot[evaluations] session engine", function () {
  this.timeout(15000);
  let harness: FakesHarness;

  beforeEach(async function () {
    harness = await new FakesHarness().start();
  });
  afterEach(async function () {
    await harness.stop();
  });

  async function run(
    scenarios: unknown[],
    llm: ProviderBehavior,
    options: { similar?: boolean; extra?: object } = {}
  ) {
    harness.llm.configure(llm);
    const steps: StepEvaluationReport[] = [];
    const summaries: [string, boolean][] = [];
    const reports: SessionScenarioReport[] = await runSessionEval(
      {
        agent: agentWith(scenarios, options.extra),
        think: resolveThink(
          "fake/llm",
          { fake: { baseUrl: harness.llm.url } },
          { temperature: 0, maxTokens: 100 }
        ),
        testTextSimilarity: async () => options.similar ?? false,
        stepTimeoutMs: 5000
      },
      {
        onStepResult: (_ref, r) => void steps.push(r),
        onScenarioComplete: (ref, passed) => void summaries.push([ref, passed])
      }
    );
    return { reports, steps, summaries };
  }

  it("evaluates a streamed reply, sentence by sentence, and keeps history across steps", async function () {
    const { reports, steps, summaries } = await run(
      [
        scenario([
          step("What are your hours?", "We open at nine. We close at five."),
          step("Thanks", "Anything else?", "SIMILAR")
        ])
      ],
      {
        script: [
          { content: "We open at nine. We close at five.", chunkDelayMs: 20 },
          { content: "Anything else I can do?" }
        ]
      },
      { similar: true }
    );
    expect(summaries).to.deep.equal([["s1", true]]);
    expect(steps).to.have.length(2);
    const [first] = reports[0].steps;
    expect(first.passed, first.errorMessage).to.equal(true);
    expect(first.aiResponse).to.equal("We open at nine. We close at five.");
    expect(first.streaming.pieces).to.deep.equal([
      "We open at nine. ",
      "We close at five."
    ]);
    expect(first.streaming.firstSpeakMs).to.be.a("number");
    // The second request carries the greeting, the first turn and its reply.
    const second = harness.llm.conversations[1].messages.map((m) => m.role);
    expect(second).to.deep.equal([
      "system",
      "assistant",
      "user",
      "assistant",
      "user"
    ]);
  });

  it("fails an EXACT step that differs, and a SIMILAR step the judge rejects", async function () {
    const { reports } = await run(
      [
        scenario([
          step("Hi", "Hello there."),
          step("And?", "Nothing.", "SIMILAR")
        ])
      ],
      { script: [{ content: "Hi!" }, { content: "Something." }] },
      { similar: false }
    );
    const [a, b] = reports[0].steps;
    expect(reports[0].overallPassed).to.equal(false);
    expect(a.errorMessage).to.contain('Expected exact response "Hello there."');
    expect(b.errorMessage).to.contain("Expected similar response");
  });

  it("checks tool calls from the structured tool messages", async function () {
    const { reports } = await run(
      [
        scenario([
          step("Weather in Paris?", "It is sunny in Paris.", "EXACT", [
            { tool: "getWeather", parameters: { city: "Paris" } }
          ]),
          step("And Rome?", "Rome is sunny too.", "EXACT", [
            { tool: "getWeather", parameters: { city: "Lisbon" } }
          ])
        ])
      ],
      {
        script: [
          {
            tool_calls: [{ name: "getWeather", arguments: { city: "Paris" } }]
          },
          { content: "It is sunny in Paris." },
          { tool_calls: [{ name: "getWeather", arguments: { city: "Rome" } }] },
          { content: "Rome is sunny too." }
        ]
      }
    );
    const [paris, rome] = reports[0].steps;
    expect(paris.passed, paris.errorMessage).to.equal(true);
    expect(paris.toolEvaluations?.[0]).to.include({
      expectedTool: "getWeather",
      actualTool: "getWeather",
      passed: true
    });
    expect(paris.toolMessages.map((m) => m.role)).to.deep.equal([
      "assistant",
      "tool"
    ]);
    expect(paris.toolMessages[1]).to.include({
      content: JSON.stringify({ status: "ok" })
    });
    // The tool result went back to the model as a tool message (no synthetic prompt).
    const followUp = harness.llm.conversations[1].messages;
    expect(followUp[followUp.length - 1].role).to.equal("tool");
    expect(rome.passed).to.equal(false);
    expect(rome.toolEvaluations?.[0].errorMessage).to.contain('"Lisbon"');
  });

  it("compares a hangup with the goodbye message and fails steps after the call ended", async function () {
    const { reports } = await run(
      [
        scenario([
          step("Bye", "Goodbye!", "EXACT", [
            { tool: "hangup", parameters: {} }
          ]),
          step("Hello?", "Anyone?")
        ])
      ],
      { script: [{ tool_calls: [{ name: "hangup", arguments: {} }] }] }
    );
    const [bye, after] = reports[0].steps;
    expect(bye.passed, bye.errorMessage).to.equal(true);
    expect(bye.aiResponse).to.equal("Goodbye!");
    expect(after.passed).to.equal(false);
    expect(after.errorMessage).to.contain("already ended");
  });

  it("reports a language model failure on the step", async function () {
    const { reports } = await run([scenario([step("Hi", "Hello.")])], {
      failNext: "provider_unavailable"
    });
    const [s] = reports[0].steps;
    expect(s.passed).to.equal(false);
    expect(s.errorMessage).to.contain("Language model error");
    expect(s.aiResponse).to.contain("Sorry, something went wrong.");
  });

  it("uses the session engine for OpenAI-compatible providers only", function () {
    const a = (model: string) =>
      sessionAgentSchema.parse({
        conversationSettings: {
          systemPrompt: "p",
          goodbyeMessage: "b",
          systemErrorMessage: "e"
        },
        languageModel: { model }
      });
    expect(sessionThinkFor(a("openai/gpt-4o-mini"), "k")).to.exist;
    expect(sessionThinkFor(a("groq/openai/gpt-oss-120b"), "k")).to.exist;
    expect(sessionThinkFor(a("google/gemini-2.0-flash"), "k")).to.equal(
      undefined
    );
  });
});
