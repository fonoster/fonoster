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
import { AnthropicThink } from "../src/anthropic";
import { adapterFor, isProviderAuthError } from "../src";
import type { ChatMessage, ThinkChunk } from "../src/llm";

const sse = (events: Record<string, unknown>[]) =>
  events
    .map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`)
    .join("");

const start = (usage: Record<string, number> = { input_tokens: 1 }) => ({
  type: "message_start",
  message: { usage: { output_tokens: 1, ...usage } }
});
const stop = (stop_reason: string, output_tokens = 1) => ({
  type: "message_delta",
  delta: { stop_reason },
  usage: { output_tokens }
});
const text = (value: string, index = 0) => [
  {
    type: "content_block_start",
    index,
    content_block: { type: "text", text: "" }
  },
  {
    type: "content_block_delta",
    index,
    delta: { type: "text_delta", text: value }
  },
  { type: "content_block_stop", index }
];
const toolUse = (index: number, id: string, name: string, json: string[]) => [
  {
    type: "content_block_start",
    index,
    content_block: { type: "tool_use", id, name, input: {} }
  },
  ...json.map((partial_json) => ({
    type: "content_block_delta",
    index,
    delta: { type: "input_json_delta", partial_json }
  })),
  { type: "content_block_stop", index }
];

describe("@fonoster/community Anthropic adapter", function () {
  let server: http.Server;
  let url: string;
  let requests: {
    body: Record<string, any>;
    headers: http.IncomingHttpHeaders;
    path: string;
  }[];
  let answer: { status?: number; events?: Record<string, unknown>[] };

  before(async () => {
    server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (d) => (raw += d));
      req.on("end", () => {
        requests.push({
          body: JSON.parse(raw),
          headers: req.headers,
          path: req.url!
        });
        if (answer.status) return res.writeHead(answer.status).end("{}");
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.end(sse(answer.events ?? []));
      });
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  after(() => server.close());
  beforeEach(() => {
    requests = [];
    answer = {
      events: [
        start(),
        ...text("Hello."),
        stop("end_turn"),
        { type: "message_stop" }
      ]
    };
  });

  const run = async (
    messages: ChatMessage[] = [{ role: "user", content: "Hi" }],
    options: Record<string, unknown> = { reasoning: true },
    tools: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    }[] = []
  ) => {
    const think = new AnthropicThink(
      { baseUrl: url, apiKey: "k", name: "anthropic" },
      "claude-haiku-5-5",
      { maxTokens: 400, ...options }
    );
    const chunks: ThinkChunk[] = [];
    for await (const c of think.stream(
      messages,
      tools,
      new AbortController().signal
    ))
      chunks.push(c);
    return chunks;
  };

  it("is registered as an LLM adapter", function () {
    expect(adapterFor("anthropic")?.llm?.defaultEndpoint).to.equal(
      "https://api.anthropic.com"
    );
  });

  it("posts to the Messages API with its auth headers and asks for caching", async function () {
    await run();
    const { body, headers, path } = requests[0];
    expect(path).to.equal("/v1/messages");
    expect(headers["x-api-key"]).to.equal("k");
    expect(headers["anthropic-version"]).to.be.a("string");
    expect(headers.authorization).to.equal(undefined);
    expect(body).to.deep.include({
      model: "claude-haiku-5-5",
      max_tokens: 400,
      stream: true,
      cache_control: { type: "ephemeral" }
    });
  });

  it("streams text", async function () {
    const chunks = await run();
    expect(chunks.filter((c) => c.type === "text")).to.deep.equal([
      { type: "text", text: "Hello." }
    ]);
  });

  it("turns thinking off, or to between_tools for a model that can only lower it", async function () {
    await run();
    expect(requests[0].body.thinking).to.deep.equal({ type: "disabled" });
    await run(undefined, { reasoningLow: true });
    expect(requests[1].body.thinking).to.deep.equal({ type: "between_tools" });
    await run(undefined, {});
    expect(requests[2].body).to.not.have.property("thinking");
  });

  it("sends temperature only when given", async function () {
    await run();
    expect(requests[0].body).to.not.have.property("temperature");
    await run(undefined, { temperature: 0.5 });
    expect(requests[1].body.temperature).to.equal(0.5);
  });

  it("moves system messages to system and sends tools with input_schema", async function () {
    await run(
      [
        { role: "system", content: "Be brief." },
        { role: "system", content: "Knowledge." },
        { role: "user", content: "Hi" }
      ],
      {},
      [{ name: "getHours", description: "d", parameters: { type: "object" } }]
    );
    const { body } = requests[0];
    expect(body.system).to.equal("Be brief.\n\nKnowledge.");
    expect(body.messages).to.deep.equal([{ role: "user", content: "Hi" }]);
    expect(body.tools).to.deep.equal([
      { name: "getHours", description: "d", input_schema: { type: "object" } }
    ]);
  });

  it("assembles tool calls from their streamed arguments", async function () {
    answer.events = [
      start(),
      ...toolUse(0, "t1", "getHours", ['{"day"', ':"mon"}']),
      ...toolUse(1, "t2", "getPrice", []),
      stop("tool_use")
    ];
    const chunks = await run();
    expect(chunks.find((c) => c.type === "tool_calls")).to.deep.equal({
      type: "tool_calls",
      calls: [
        { id: "t1", name: "getHours", arguments: '{"day":"mon"}' },
        { id: "t2", name: "getPrice", arguments: "" }
      ]
    });
  });

  it("replays a tool round: tool_use, then merged tool_result blocks, with no empty text", async function () {
    await run([
      { role: "assistant", content: "How can I help?" },
      { role: "user", content: "Hours and price?" },
      {
        role: "assistant",
        content: "",
        tool_calls: [
          { id: "t1", name: "getHours", arguments: '{"day":"mon"}' },
          { id: "t2", name: "getPrice", arguments: "" }
        ]
      },
      { role: "tool", tool_call_id: "t1", content: '{"open":"9"}' },
      { role: "tool", tool_call_id: "t2", content: '{"usd":80}' }
    ]);
    expect(requests[0].body.messages).to.deep.equal([
      { role: "assistant", content: "How can I help?" },
      { role: "user", content: "Hours and price?" },
      {
        role: "assistant",
        content: [
          {
            type: "tool_use",
            id: "t1",
            name: "getHours",
            input: { day: "mon" }
          },
          { type: "tool_use", id: "t2", name: "getPrice", input: {} }
        ]
      },
      {
        role: "user",
        content: [
          { type: "tool_result", tool_use_id: "t1", content: '{"open":"9"}' },
          { type: "tool_result", tool_use_id: "t2", content: '{"usd":80}' }
        ]
      }
    ]);
  });

  it("leaves out an assistant message with no text and no tool calls", async function () {
    await run([
      { role: "user", content: "Hi" },
      { role: "assistant", content: "" },
      { role: "user", content: "Hello?" }
    ]);
    expect(requests[0].body.messages.map((m: any) => m.role)).to.deep.equal([
      "user",
      "user"
    ]);
  });

  it("keeps thinking blocks through a tool round, unmodified", async function () {
    answer.events = [
      start(),
      {
        type: "content_block_start",
        index: 0,
        content_block: { type: "thinking", thinking: "" }
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "thinking_delta", thinking: "Checking" }
      },
      {
        type: "content_block_delta",
        index: 0,
        delta: { type: "signature_delta", signature: "sig" }
      },
      { type: "content_block_stop", index: 0 },
      ...toolUse(1, "t1", "getHours", ["{}"]),
      stop("tool_use")
    ];
    const chunks = await run();
    const calls = (chunks.find((c) => c.type === "tool_calls") as any).calls;
    await run([
      { role: "user", content: "Hours?" },
      { role: "assistant", content: "", tool_calls: calls },
      { role: "tool", tool_call_id: "t1", content: "{}" }
    ]);
    expect(requests[1].body.messages[1].content).to.deep.equal([
      { type: "thinking", thinking: "Checking", signature: "sig" },
      { type: "tool_use", id: "t1", name: "getHours", input: {} }
    ]);
  });

  it("counts cached tokens as part of the input tokens", async function () {
    answer.events = [
      start({
        input_tokens: 10,
        cache_read_input_tokens: 100,
        cache_creation_input_tokens: 5
      }),
      ...text("Hi."),
      stop("end_turn", 20)
    ];
    const chunks = await run();
    expect(chunks.find((c) => c.type === "usage")).to.deep.equal({
      type: "usage",
      usage: { inputTokens: 115, outputTokens: 20, cachedTokens: 100 }
    });
  });

  const failure = async () => {
    try {
      await run();
    } catch (e) {
      return e as Error & { code?: string };
    }
    throw new Error("expected a failure");
  };

  it("fails on a refusal", async function () {
    answer.events = [start(), stop("refusal")];
    expect((await failure()).code).to.equal("bad_message");
  });

  it("maps a stream error to provider_unavailable", async function () {
    answer.events = [
      start(),
      {
        type: "error",
        error: { type: "overloaded_error", message: "Overloaded" }
      }
    ];
    expect((await failure()).code).to.equal("provider_unavailable");
  });

  it("maps HTTP errors like other language models", async function () {
    answer = { status: 401 };
    const rejected = await failure();
    expect(isProviderAuthError(rejected)).to.equal(true);
    answer = { status: 400 };
    expect((await failure()).code).to.equal("bad_message");
    answer = { status: 429 };
    expect((await failure()).code).to.equal("provider_unavailable");
    answer = { status: 529 };
    expect((await failure()).code).to.equal("provider_unavailable");
  });
});
