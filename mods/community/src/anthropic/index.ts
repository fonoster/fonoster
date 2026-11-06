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
import { TextDecoder } from "util";
import { isAuthStatus, ProviderAuthError } from "../errors";
import { discardBody } from "../http";
import {
  ChatMessage,
  Think,
  ThinkChunk,
  ThinkError,
  ThinkProvider,
  TokenUsage,
  ToolCall,
  ToolSpec
} from "../llm";

// Anthropic's native Messages API. Its OpenAI-compatible layer has no prompt caching and isn't
// meant for production.

export const ANTHROPIC_ENDPOINT = "https://api.anthropic.com";
const ANTHROPIC_VERSION = "2026-10-21";

/** Thinking blocks kept on a tool call, to be sent back unmodified with its results. */
type VendorData = { thinking: Record<string, unknown>[] };

type ContentBlock =
  | { kind: "text" }
  | { kind: "tool"; call: ToolCall }
  | { kind: "thinking"; block: Record<string, unknown> };

export class AnthropicThink implements Think {
  constructor(
    private readonly provider: ThinkProvider,
    private readonly model: string,
    private readonly options: {
      /** Left out of the request when absent; recent models reject it. */
      temperature?: number;
      maxTokens: number;
      /** Catalog feature `reasoning`: the model can run with thinking off. */
      reasoning?: boolean;
      /** Catalog feature `reasoning-low`: the lowest it allows is between_tools. */
      reasoningLow?: boolean;
    }
  ) {}

  async *stream(
    messages: ChatMessage[],
    tools: ToolSpec[],
    signal: AbortSignal
  ): AsyncIterable<ThinkChunk> {
    const { reasoning, reasoningLow, temperature, maxTokens } = this.options;
    const system = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");
    const body = {
      model: this.model,
      max_tokens: maxTokens,
      stream: true,
      // One breakpoint that moves forward as the conversation grows.
      cache_control: { type: "ephemeral" },
      ...(system ? { system } : {}),
      messages: toAnthropic(messages),
      ...(temperature === undefined ? {} : { temperature }),
      ...(reasoning ? { thinking: { type: "disabled" } } : {}),
      ...(reasoningLow ? { thinking: { type: "between_tools" } } : {}),
      ...(tools.length
        ? {
            tools: tools.map((t) => ({
              name: t.name,
              description: t.description,
              input_schema: t.parameters
            }))
          }
        : {})
    };
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(
        `${this.provider.baseUrl.replace(/\/$/, "")}/v1/messages`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "anthropic-version": ANTHROPIC_VERSION,
            "x-api-key": this.provider.apiKey ?? ""
          },
          body: JSON.stringify(body),
          signal
        }
      );
    } catch (e) {
      if (signal.aborted) throw e;
      throw new ThinkError(
        "provider_unavailable",
        `language model unreachable: ${(e as Error).message}`
      );
    }
    // A rejected key is fatal to the call, never retried (#1146).
    if (isAuthStatus(res.status)) {
      await discardBody(res);
      throw new ProviderAuthError(
        this.provider.name ?? "anthropic",
        "llm",
        res.status
      );
    }
    if (res.status === 400 || res.status === 422) {
      await discardBody(res);
      throw new ThinkError(
        "bad_message",
        `language model rejected the request (HTTP ${res.status})`
      );
    }
    if (!res.ok || !res.body) {
      await discardBody(res);
      throw new ThinkError(
        "provider_unavailable",
        `language model answered HTTP ${res.status}`
      );
    }

    const blocks = new Map<number, ContentBlock>();
    const usage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0
    };
    let sawUsage = false;
    const decoder = new TextDecoder();
    let buffer = "";
    const reader = res.body.getReader();
    for (;;) {
      let next: Awaited<ReturnType<typeof reader.read>>;
      try {
        next = await reader.read();
      } catch (e) {
        if (signal.aborted) throw e;
        throw new ThinkError(
          "provider_unavailable",
          `language model stream failed: ${(e as Error).message}`
        );
      }
      const { done, value } = next;
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;
        const event = JSON.parse(line.slice(5).trim());
        switch (event.type) {
          case "message_start": {
            const u = event.message?.usage ?? {};
            const read = u.cache_read_input_tokens ?? 0;
            usage.inputTokens =
              (u.input_tokens ?? 0) +
              read +
              (u.cache_creation_input_tokens ?? 0);
            usage.cachedTokens = read;
            usage.outputTokens = u.output_tokens ?? 0;
            sawUsage = true;
            break;
          }
          case "content_block_start": {
            const b = event.content_block ?? {};
            if (b.type === "tool_use")
              blocks.set(event.index, {
                kind: "tool",
                call: { id: b.id, name: b.name, arguments: "" }
              });
            else if (b.type === "text")
              blocks.set(event.index, { kind: "text" });
            // thinking and redacted_thinking go back as they came.
            else blocks.set(event.index, { kind: "thinking", block: { ...b } });
            break;
          }
          case "content_block_delta": {
            const block = blocks.get(event.index);
            const d = event.delta ?? {};
            if (d.type === "text_delta" && d.text)
              yield { type: "text", text: d.text };
            else if (d.type === "input_json_delta" && block?.kind === "tool")
              block.call.arguments += d.partial_json ?? "";
            else if (d.type === "thinking_delta" && block?.kind === "thinking")
              block.block.thinking =
                String(block.block.thinking ?? "") + (d.thinking ?? "");
            else if (d.type === "signature_delta" && block?.kind === "thinking")
              block.block.signature = d.signature;
            break;
          }
          case "message_delta":
            if (event.usage?.output_tokens !== undefined)
              usage.outputTokens = event.usage.output_tokens;
            if (event.delta?.stop_reason === "refusal")
              throw new ThinkError(
                "bad_message",
                "language model refused the request"
              );
            break;
          case "error":
            throw new ThinkError(
              "provider_unavailable",
              `language model stream failed: ${event.error?.type ?? "error"}`
            );
        }
      }
    }
    const ordered = [...blocks.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, b]) => b);
    const calls = ordered.flatMap((b) => (b.kind === "tool" ? [b.call] : []));
    const thinking = ordered.flatMap((b) =>
      b.kind === "thinking" ? [b.block] : []
    );
    if (calls.length) {
      if (thinking.length)
        calls[0].extraContent = { thinking } satisfies VendorData;
      yield { type: "tool_calls", calls };
    }
    if (sawUsage) yield { type: "usage", usage };
  }
}

function parseInput(call: ToolCall): unknown {
  try {
    return call.arguments ? JSON.parse(call.arguments) : {};
  } catch {
    return {};
  }
}

/** Our history as Messages API turns; system messages go in the request's `system`. */
function toAnthropic(messages: ChatMessage[]) {
  type Turn = { role: "user" | "assistant"; content: unknown };
  const turns: Turn[] = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "tool") {
      const result = {
        type: "tool_result",
        tool_use_id: m.tool_call_id,
        content: m.content
      };
      const last = turns[turns.length - 1];
      // All the results of one round belong in the same user message.
      if (last?.role === "user" && Array.isArray(last.content))
        (last.content as unknown[]).push(result);
      else turns.push({ role: "user", content: [result] });
      continue;
    }
    if (m.role === "assistant" && m.tool_calls?.length) {
      const vendor = m.tool_calls[0].extraContent as VendorData | undefined;
      turns.push({
        role: "assistant",
        content: [
          ...(vendor?.thinking ?? []),
          ...(m.content ? [{ type: "text", text: m.content }] : []),
          ...m.tool_calls.map((c) => ({
            type: "tool_use",
            id: c.id,
            name: c.name,
            input: parseInput(c)
          }))
        ]
      });
      continue;
    }
    // The API refuses empty text; a reply nobody heard leaves an empty assistant turn.
    if (m.content) turns.push({ role: m.role, content: m.content });
  }
  return turns;
}
