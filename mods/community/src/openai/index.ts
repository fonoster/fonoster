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

// OpenAI-compatible Chat Completions (rework-autopilot A8), which covers OpenAI, Groq, Ollama and
// the conformance fake LLM. Registered for those catalog adapters in ../adapters.ts.

/** Adapters whose LLMs speak OpenAI-compatible Chat Completions, with their default endpoints. */
export const OPENAI_COMPATIBLE: Record<string, string | undefined> = {
  openai: "https://api.openai.com",
  groq: "https://api.groq.com/openai",
  ollama: "http://localhost:11434",
  fake: undefined
};

export class OpenAiCompatibleThink implements Think {
  constructor(
    private readonly provider: ThinkProvider,
    private readonly model: string,
    private readonly options: {
      temperature: number;
      maxTokens: number;
      /** Ask for a JSON object reply (catalog feature `json-mode`). */
      jsonMode?: boolean;
    }
  ) {}

  async *stream(
    messages: ChatMessage[],
    tools: ToolSpec[],
    signal: AbortSignal
  ): AsyncIterable<ThinkChunk> {
    const body = {
      model: this.model,
      stream: true,
      // The final chunk carries the request's token usage (add-usage-metering D6).
      stream_options: { include_usage: true },
      temperature: this.options.temperature,
      max_tokens: this.options.maxTokens,
      messages: messages.map(toOpenAi),
      ...(tools.length
        ? { tools: tools.map((t) => ({ type: "function", function: t })) }
        : {}),
      ...(this.options.jsonMode
        ? { response_format: { type: "json_object" } }
        : {})
    };
    let res: Awaited<ReturnType<typeof fetch>>;
    try {
      res = await fetch(
        `${this.provider.baseUrl.replace(/\/$/, "")}/v1/chat/completions`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(this.provider.apiKey
              ? { authorization: `Bearer ${this.provider.apiKey}` }
              : {})
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
    if (res.status === 400 || res.status === 422)
      throw new ThinkError(
        "bad_message",
        `language model rejected the request (HTTP ${res.status})`
      );
    if (!res.ok || !res.body)
      throw new ThinkError(
        "provider_unavailable",
        `language model answered HTTP ${res.status}`
      );

    const calls = new Map<number, ToolCall>();
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
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        const parsed = JSON.parse(data);
        if (parsed.usage) usage = toTokenUsage(parsed.usage);
        const delta = parsed.choices?.[0]?.delta ?? {};
        if (delta.content) yield { type: "text", text: delta.content };
        for (const tc of delta.tool_calls ?? []) {
          const call = calls.get(tc.index) ?? {
            id: tc.id ?? `call_${tc.index}`,
            name: "",
            arguments: ""
          };
          if (tc.function?.name) call.name = tc.function.name;
          if (tc.function?.arguments) call.arguments += tc.function.arguments;
          calls.set(tc.index, call);
        }
      }
    }
    if (calls.size) yield { type: "tool_calls", calls: [...calls.values()] };
    if (usage) yield { type: "usage", usage };
  }
}

/** OpenAI's usage object as TokenUsage; cached tokens are optional in OpenAI-compatible APIs. */
function toTokenUsage(u: {
  prompt_tokens?: number;
  completion_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
}): TokenUsage {
  return {
    inputTokens: u.prompt_tokens ?? 0,
    outputTokens: u.completion_tokens ?? 0,
    cachedTokens: u.prompt_tokens_details?.cached_tokens ?? 0
  };
}

function toOpenAi(m: ChatMessage) {
  if (m.role === "assistant" && m.tool_calls?.length) {
    return {
      role: "assistant",
      content: m.content || null,
      tool_calls: m.tool_calls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: c.arguments }
      }))
    };
  }
  return m;
}

/** Resolves a catalog id (`<provider>/<model>`) against configured providers. */
export function resolveThink(
  catalogId: string,
  providers: Record<string, ThinkProvider>,
  options: { temperature: number; maxTokens: number }
): Think {
  const slash = catalogId.indexOf("/");
  const providerName = catalogId.slice(0, slash);
  const provider = providers[providerName];
  if (!provider)
    throw new Error(
      `no language model provider "${providerName}" for ${catalogId}`
    );
  return new OpenAiCompatibleThink(
    provider,
    catalogId.slice(slash + 1),
    options
  );
}
