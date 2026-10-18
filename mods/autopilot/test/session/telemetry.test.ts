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
import { initTelemetry, Telemetry } from "@fonoster/common";
import {
  Agent,
  sessionAssistantSchema,
  setTelemetry,
  telemetry
} from "../../src/session";

type Rec = {
  name: string;
  parent?: string;
  ended: boolean;
  error?: string;
};

// An in-memory exporter: records the spans and counters the OTLP one would send.
function memory() {
  const spans: Rec[] = [];
  const counters: Record<string, number> = {};
  const span = (name: string, _attrs?: unknown, parent?: string) => {
    const rec: Rec = { name, parent, ended: false };
    spans.push(rec);
    return {
      traceparent: "",
      event: () => undefined,
      end: (_a?: unknown, error?: string) => {
        rec.ended = true;
        rec.error = error;
      }
    };
  };
  const t = {
    enabled: true,
    startCall: (_ref: string, name: string, a?: unknown, parent?: string) =>
      span(name, a, parent),
    startSpan: span,
    traceparent: () => `00-${"c".repeat(32)}-${"d".repeat(16)}-01`,
    log: () => undefined,
    count: (n: string, v = 1) => {
      counters[n] = (counters[n] ?? 0) + v;
    },
    gauge: () => undefined,
    shutdown: async () => undefined
  } as unknown as Telemetry;
  return { t, spans, counters };
}

const assistant = sessionAssistantSchema.parse({
  conversationSettings: {
    systemPrompt: "p",
    goodbyeMessage: "bye",
    systemErrorMessage: "err"
  },
  languageModel: { model: "openai/gpt-4o-mini" }
});

describe("@autopilot/session telemetry", function () {
  afterEach(() =>
    setTelemetry(initTelemetry("fonoster-autopilot", undefined, {}))
  );

  it("records a turn span with an LLM request child and the turn and latency metrics", async function () {
    const { t, spans, counters } = memory();
    setTelemetry(t);
    const session = {
      callRef: "call-1",
      say: async (pieces: AsyncIterable<string>) => {
        for await (const piece of pieces) void piece;
        return { interrupted: false, heardText: "hi", heardMs: 1 };
      },
      play: async () => ({ interrupted: false, heardMs: 0 })
    };
    const think = {
      async *stream() {
        yield { type: "text", text: "Hello there." };
      }
    };
    const agent = new Agent(
      session as never,
      assistant,
      think as never,
      {} as never,
      { turn: () => undefined, note: () => undefined } as never
    );
    await agent.answer("hello");

    const turn = spans.find((s) => s.name === "autopilot.turn")!;
    const llm = spans.find((s) => s.name === "autopilot.llm.request")!;
    expect(turn.ended).to.equal(true);
    expect(llm.ended).to.equal(true);
    expect(llm.parent).to.match(/^00-c{32}-d{16}-01$/);
    expect(counters["fonoster.autopilot.turns"]).to.equal(1);
    expect(counters["fonoster.autopilot.llm.requests"]).to.equal(1);
    expect(counters).to.have.property("fonoster.autopilot.llm.latency_ms");
  });

  it("marks the LLM span failed when the model errors", async function () {
    const { t, spans } = memory();
    setTelemetry(t);
    const session = {
      callRef: "call-2",
      say: async (pieces: AsyncIterable<string>) => {
        for await (const piece of pieces) void piece;
        return { interrupted: false, heardText: "", heardMs: 0 };
      },
      play: async () => ({ interrupted: false, heardMs: 0 })
    };
    const think = {
      // eslint-disable-next-line require-yield
      async *stream() {
        throw new Error("boom");
      }
    };
    const agent = new Agent(
      session as never,
      assistant,
      think as never,
      {} as never,
      { turn: () => undefined, note: () => undefined } as never
    );
    agent.send = () => undefined;
    await agent.answer("hello");
    const llm = spans.find((s) => s.name === "autopilot.llm.request")!;
    expect(llm.error).to.equal("boom");
  });

  it("is a no-op when no OTLP endpoint is set", function () {
    expect(telemetry.enabled).to.equal(false);
    expect(telemetry.startSpan("x").traceparent).to.equal("");
  });
});
