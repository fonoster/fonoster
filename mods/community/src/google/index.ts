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

// Google's native generateContent API: faster than its OpenAI-compatible layer, which is in beta,
// and it takes a thinking level directly.

export const GOOGLE_ENDPOINT = "https://generativelanguage.googleapis.com";

/** What a function call needs back in later requests; our ToolCall id may be a made-up one. */
type VendorData = { id?: string; thoughtSignature?: string };

const NORMAL_ENDS = new Set([
  "STOP",
  "MAX_TOKENS",
  "FINISH_REASON_UNSPECIFIED"
]);

export class GoogleThink implements Think {
  constructor(
    private readonly provider: ThinkProvider,
    private readonly model: string,
    private readonly options: {
      /** Left out of the request when absent; recent models ignore it. */
      temperature?: number;
      maxTokens: number;
      /** Catalog feature `reasoning`: the model takes thinking level minimal. */
      reasoning?: boolean;
      /** Catalog feature `reasoning-low`: the lowest it allows is low. */
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
    const thinkingLevel = reasoning
      ? "minimal"
      : reasoningLow
        ? "low"
        : undefined;
    const body = {
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      contents: toContents(messages),
      generationConfig: {
        maxOutputTokens: maxTokens,
        ...(temperature === undefined ? {} : { temperature }),
        ...(thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {})
      },
      ...(tools.length
        ? {
            tools: [
              {
                functionDeclarations: tools.map((t) => ({
                  name: t.name,
                  description: t.description,
                  parametersJsonSchema: t.parameters
                }))
              }
            ]
          }
        : {})
    };
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(
        `${this.provider.baseUrl.replace(/\/$/, "")}/v1beta/models/${encodeURIComponent(this.model)}:streamGenerateContent?alt=sse`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": this.provider.apiKey ?? ""
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
    const rejected = () =>
      new ProviderAuthError(this.provider.name ?? "google", "llm", res.status);
    // A rejected key is fatal to the call, never retried (#1146).
    if (isAuthStatus(res.status)) {
      await discardBody(res);
      throw rejected();
    }
    if (res.status === 400 || res.status === 422) {
      // Google answers a bad key with 400, told apart only by its body.
      const detail = await res.text().catch(() => "");
      if (detail.includes("API_KEY_INVALID")) throw rejected();
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

    const calls: ToolCall[] = [];
    let usage: TokenUsage | undefined;
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
        if (event.promptFeedback?.blockReason)
          throw new ThinkError(
            "bad_message",
            `language model blocked the request: ${event.promptFeedback.blockReason}`
          );
        const candidate = event.candidates?.[0];
        for (const part of candidate?.content?.parts ?? []) {
          if (part.functionCall) {
            const { id, name, args } = part.functionCall;
            const vendor: VendorData = {
              ...(id ? { id } : {}),
              ...(part.thoughtSignature
                ? { thoughtSignature: part.thoughtSignature }
                : {})
            };
            calls.push({
              id: id ?? `call_${calls.length}`,
              name,
              arguments: JSON.stringify(args ?? {}),
              extraContent: vendor
            });
          } else if (part.text && !part.thought) {
            yield { type: "text", text: part.text };
          }
        }
        if (candidate?.finishReason && !NORMAL_ENDS.has(candidate.finishReason))
          throw new ThinkError(
            "bad_message",
            `language model stopped: ${candidate.finishReason}`
          );
        const u = event.usageMetadata;
        if (u)
          usage = {
            inputTokens: u.promptTokenCount ?? 0,
            outputTokens:
              (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0),
            cachedTokens: u.cachedContentTokenCount ?? 0
          };
      }
    }
    if (calls.length) yield { type: "tool_calls", calls };
    if (usage) yield { type: "usage", usage };
  }
}

function parseArgs(call: ToolCall): unknown {
  try {
    return call.arguments ? JSON.parse(call.arguments) : {};
  } catch {
    return {};
  }
}

/** A function response must be an object; anything else goes under `result`. */
function toResponse(content: string): unknown {
  try {
    const value = JSON.parse(content);
    return value && typeof value === "object" && !Array.isArray(value)
      ? value
      : { result: value };
  } catch {
    return { result: content };
  }
}

/** Our history as Gemini contents; system messages go in `systemInstruction`. */
function toContents(messages: ChatMessage[]) {
  type Content = { role: "user" | "model"; parts: unknown[] };
  const contents: Content[] = [];
  const callsById = new Map<string, ToolCall>();
  let lastWasToolResult = false;
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "tool") {
      const call = callsById.get(m.tool_call_id);
      const vendor = call?.extraContent as VendorData | undefined;
      const part = {
        functionResponse: {
          ...(vendor?.id ? { id: vendor.id } : {}),
          name: call?.name ?? "",
          response: toResponse(m.content)
        }
      };
      // All the responses of one round belong in the same user turn.
      if (lastWasToolResult) contents[contents.length - 1].parts.push(part);
      else contents.push({ role: "user", parts: [part] });
      lastWasToolResult = true;
      continue;
    }
    lastWasToolResult = false;
    if (m.role === "assistant" && m.tool_calls?.length) {
      contents.push({
        role: "model",
        parts: [
          ...(m.content ? [{ text: m.content }] : []),
          ...m.tool_calls.map((c) => {
            callsById.set(c.id, c);
            const vendor = c.extraContent as VendorData | undefined;
            return {
              functionCall: {
                ...(vendor?.id ? { id: vendor.id } : {}),
                name: c.name,
                args: parseArgs(c)
              },
              ...(vendor?.thoughtSignature
                ? { thoughtSignature: vendor.thoughtSignature }
                : {})
            };
          })
        ]
      });
      continue;
    }
    // A reply nobody heard leaves an empty assistant turn.
    if (m.content)
      contents.push({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      });
  }
  return contents;
}
