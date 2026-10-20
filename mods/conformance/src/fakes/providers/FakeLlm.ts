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
import { FakeProvider } from "./FakeProvider";
import { ProviderLedger } from "./ProviderLedger";

export type LlmReply =
  | { content: string; chunkDelayMs?: number }
  | { tool_calls: { name: string; arguments: Record<string, unknown> }[] };

type ChatMessage = { role: string; content?: string };

/**
 * Fake LLM with an OpenAI-compatible surface, so any adapter that speaks Chat Completions can be
 * pointed at it.
 *
 *   POST /v1/chat/completions  {messages, stream?}
 *
 * Replies come from the script in order ({content} or {tool_calls}); with an empty script the
 * reply is "Echo: <last user message>". Streaming sends one chunk per word.
 *
 * Usage is deterministic, so tests know the exact counts (add-usage-metering): prompt tokens are
 * the words of every message's content, completion tokens the words of the reply (10 for tool
 * calls), no cached tokens. A streamed reply reports it in a final chunk with no choices when the
 * request sets stream_options.include_usage; `omitUsage` leaves it out.
 *
 * Implementations' built-in "fake" adapters speak this protocol (see PROVIDERS.md).
 */
export class FakeLlm extends FakeProvider {
  readonly conversations: { at: number; messages: ChatMessage[] }[] = [];
  private queue: LlmReply[] = [];

  constructor(ledger?: ProviderLedger) {
    super("llm", ledger);
  }

  configure(behavior: Parameters<FakeProvider["configure"]>[0]) {
    if (behavior.script) this.queue = [...(behavior.script as LlmReply[])];
    super.configure(behavior);
  }

  protected async serve(
    req: http.IncomingMessage,
    body: unknown,
    res: http.ServerResponse
  ) {
    if (
      req.method !== "POST" ||
      req.url?.split("?")[0] !== "/v1/chat/completions"
    ) {
      return this.json(res, 404, { error: { code: "not_found" } });
    }
    const { messages, stream, stream_options } = (body ?? {}) as {
      messages?: ChatMessage[];
      stream?: boolean;
      stream_options?: { include_usage?: boolean };
    };
    if (!Array.isArray(messages)) {
      return this.json(res, 400, {
        error: { code: "bad_request", message: "messages is required" }
      });
    }
    this.conversations.push({ at: Date.now(), messages });

    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const reply: LlmReply = this.queue.shift() ?? {
      content: `Echo: ${lastUser?.content ?? ""}`
    };
    const id = `chatcmpl-fake-${this.requests}`;
    const usage = fakeUsage(messages, reply);
    const reportUsage = !this.behavior.omitUsage;
    const created = Math.floor(Date.now() / 1000);

    await this.delay();

    const toolCalls =
      "tool_calls" in reply
        ? reply.tool_calls.map((t, i) => ({
            index: i,
            id: `call_${i}`,
            type: "function",
            function: { name: t.name, arguments: JSON.stringify(t.arguments) }
          }))
        : undefined;

    if (!stream) {
      return this.json(res, 200, {
        id,
        object: "chat.completion",
        created,
        model: "fake",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "content" in reply ? reply.content : null,
              tool_calls: toolCalls
            },
            finish_reason: toolCalls ? "tool_calls" : "stop"
          }
        ],
        ...(reportUsage ? { usage } : {})
      });
    }

    res.writeHead(200, {
      "content-type": "text/event-stream",
      "cache-control": "no-cache"
    });
    const send = (
      delta: Record<string, unknown>,
      finish: string | null = null
    ) =>
      res.write(
        `data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: "fake", choices: [{ index: 0, delta, finish_reason: finish }] })}\n\n`
      );

    send({ role: "assistant" });
    if ("content" in reply) {
      for (const piece of reply.content.match(/\S+\s*/g) ?? []) {
        send({ content: piece });
        // Optional pause after each sentence, to test streaming into speech.
        if (reply.chunkDelayMs && /[.!?]\s*$/.test(piece)) {
          await new Promise((r) => setTimeout(r, reply.chunkDelayMs));
        }
      }
      send({}, "stop");
    } else {
      send({ tool_calls: toolCalls });
      send({}, "tool_calls");
    }
    if (reportUsage && stream_options?.include_usage)
      res.write(
        `data: ${JSON.stringify({ id, object: "chat.completion.chunk", created, model: "fake", choices: [], usage })}\n\n`
      );
    res.end("data: [DONE]\n\n");
  }
}

const words = (text?: string | null) =>
  (text ?? "").split(/\s+/).filter(Boolean).length;

/** The fake's fixed token counts for a request and its reply (see the class comment). */
export function fakeUsage(messages: ChatMessage[], reply: LlmReply) {
  const prompt = messages.reduce((n, m) => n + words(m.content), 0);
  const completion = "content" in reply ? words(reply.content) : 10;
  return {
    prompt_tokens: prompt,
    completion_tokens: completion,
    total_tokens: prompt + completion,
    prompt_tokens_details: { cached_tokens: 0 }
  };
}
