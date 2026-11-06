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
import { adapterFor, isProviderAuthError } from "../src";
import { GoogleThink } from "../src/google";
import type { ChatMessage, ThinkChunk } from "../src/llm";

const sse = (events: Record<string, unknown>[]) =>
  events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
const parts = (p: unknown[], finishReason?: string) => ({
  candidates: [{ content: { role: "model", parts: p }, finishReason }]
});

describe("@fonoster/community Google adapter", function () {
  let server: http.Server;
  let url: string;
  let requests: {
    body: Record<string, any>;
    headers: http.IncomingHttpHeaders;
    path: string;
  }[];
  let answer: {
    status?: number;
    text?: string;
    events?: Record<string, unknown>[];
  };

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
        if (answer.status)
          return res.writeHead(answer.status).end(answer.text ?? "{}");
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
    answer = { events: [parts([{ text: "Hello." }], "STOP")] };
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
    const think = new GoogleThink(
      { baseUrl: url, apiKey: "k", name: "google" },
      "gemini-3.5-flash-lite",
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
    expect(adapterFor("google")?.llm?.defaultEndpoint).to.equal(
      "https://generativelanguage.googleapis.com"
    );
  });

  it("streams from the native API with its auth header", async function () {
    const chunks = await run();
    const { path, headers, body } = requests[0];
    expect(path).to.equal(
      "/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent?alt=sse"
    );
    expect(headers["x-goog-api-key"]).to.equal("k");
    expect(headers.authorization).to.equal(undefined);
    expect(body.generationConfig.maxOutputTokens).to.equal(400);
    expect(chunks.filter((c) => c.type === "text")).to.deep.equal([
      { type: "text", text: "Hello." }
    ]);
  });

  it("asks for the lowest thinking the catalog says the model allows", async function () {
    await run();
    expect(requests[0].body.generationConfig.thinkingConfig).to.deep.equal({
      thinkingLevel: "minimal"
    });
    await run(undefined, { reasoningLow: true });
    expect(requests[1].body.generationConfig.thinkingConfig).to.deep.equal({
      thinkingLevel: "low"
    });
    await run(undefined, {});
    expect(requests[2].body.generationConfig).to.not.have.property(
      "thinkingConfig"
    );
  });

  it("sends temperature only when given", async function () {
    await run();
    expect(requests[0].body.generationConfig).to.not.have.property(
      "temperature"
    );
    await run(undefined, { temperature: 0.5 });
    expect(requests[1].body.generationConfig.temperature).to.equal(0.5);
  });

  it("maps system messages and tools", async function () {
    await run(
      [
        { role: "system", content: "Be brief." },
        { role: "system", content: "Knowledge." },
        { role: "user", content: "Hi" }
      ],
      {},
      [{ name: "hangup", description: "d", parameters: { type: "object" } }]
    );
    const { body } = requests[0];
    expect(body.systemInstruction).to.deep.equal({
      parts: [{ text: "Be brief.\n\nKnowledge." }]
    });
    expect(body.contents).to.deep.equal([
      { role: "user", parts: [{ text: "Hi" }] }
    ]);
    expect(body.tools).to.deep.equal([
      {
        functionDeclarations: [
          {
            name: "hangup",
            description: "d",
            parametersJsonSchema: { type: "object" }
          }
        ]
      }
    ]);
  });

  it("does not speak thought parts", async function () {
    answer.events = [
      parts([{ text: "Secret", thought: true }, { text: "Hi." }], "STOP")
    ];
    const chunks = await run();
    expect(chunks.filter((c) => c.type === "text")).to.deep.equal([
      { type: "text", text: "Hi." }
    ]);
  });

  it("replays a tool round with its signature and merged responses", async function () {
    answer.events = [
      parts([
        {
          functionCall: { id: "c1", name: "getHours", args: { day: "mon" } },
          thoughtSignature: "sig"
        },
        { functionCall: { name: "getPrice", args: {} } }
      ]),
      parts([{ text: "" }], "STOP")
    ];
    const chunks = await run();
    const calls = (chunks.find((c) => c.type === "tool_calls") as any).calls;
    expect(calls.map((c: any) => [c.id, c.name, c.arguments])).to.deep.equal([
      ["c1", "getHours", '{"day":"mon"}'],
      ["call_1", "getPrice", "{}"]
    ]);

    answer.events = [parts([{ text: "Done." }], "STOP")];
    await run([
      { role: "assistant", content: "How can I help?" },
      { role: "user", content: "Hours and price?" },
      { role: "assistant", content: "", tool_calls: calls },
      { role: "tool", tool_call_id: "c1", content: '{"open":"9"}' },
      { role: "tool", tool_call_id: "call_1", content: "[1]" }
    ]);
    expect(requests[1].body.contents).to.deep.equal([
      { role: "model", parts: [{ text: "How can I help?" }] },
      { role: "user", parts: [{ text: "Hours and price?" }] },
      {
        role: "model",
        parts: [
          {
            functionCall: { id: "c1", name: "getHours", args: { day: "mon" } },
            thoughtSignature: "sig"
          },
          { functionCall: { name: "getPrice", args: {} } }
        ]
      },
      {
        role: "user",
        parts: [
          {
            functionResponse: {
              id: "c1",
              name: "getHours",
              response: { open: "9" }
            }
          },
          { functionResponse: { name: "getPrice", response: { result: [1] } } }
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
    expect(requests[0].body.contents.map((c: any) => c.role)).to.deep.equal([
      "user",
      "user"
    ]);
  });

  it("reports usage, thinking included, with cached tokens inside input", async function () {
    answer.events = [
      {
        ...parts([{ text: "Hi." }], "STOP"),
        usageMetadata: {
          promptTokenCount: 100,
          cachedContentTokenCount: 40,
          candidatesTokenCount: 10,
          thoughtsTokenCount: 5
        }
      }
    ];
    const chunks = await run();
    expect(chunks.find((c) => c.type === "usage")).to.deep.equal({
      type: "usage",
      usage: { inputTokens: 100, outputTokens: 15, cachedTokens: 40 }
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

  it("fails on a blocked prompt or a stop reason that isn't a normal end", async function () {
    answer.events = [{ promptFeedback: { blockReason: "SAFETY" } }];
    expect((await failure()).code).to.equal("bad_message");
    answer.events = [parts([], "MALFORMED_FUNCTION_CALL")];
    expect((await failure()).code).to.equal("bad_message");
    answer.events = [parts([{ text: "Cut" }], "MAX_TOKENS")];
    expect(await run()).to.have.length.greaterThan(0);
  });

  it("treats Google's HTTP 400 for a bad key as a rejected key", async function () {
    answer = {
      status: 400,
      text: JSON.stringify({
        error: {
          status: "INVALID_ARGUMENT",
          details: [{ reason: "API_KEY_INVALID" }]
        }
      })
    };
    expect(isProviderAuthError(await failure())).to.equal(true);
  });

  it("maps other HTTP errors like other language models", async function () {
    answer = { status: 403 };
    expect(isProviderAuthError(await failure())).to.equal(true);
    answer = { status: 400 };
    expect((await failure()).code).to.equal("bad_message");
    answer = { status: 429 };
    expect((await failure()).code).to.equal("provider_unavailable");
    answer = { status: 503 };
    expect((await failure()).code).to.equal("provider_unavailable");
  });
});
