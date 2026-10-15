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

// The Think plug (rework-autopilot A8): a streaming LLM behind one interface. The first
// implementation speaks OpenAI-compatible Chat Completions, which covers OpenAI, most hosted
// models and the conformance fake LLM. The provider registry will choose implementations by
// catalog id; until then, `resolveThink` maps the catalog id's provider to a configured endpoint.

export type ToolCall = { id: string; name: string; arguments: string };

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type ThinkChunk =
  | { type: "text"; text: string }
  | { type: "tool_calls"; calls: ToolCall[] };

export type ToolSpec = {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
};

export interface Think {
  stream(
    messages: ChatMessage[],
    tools: ToolSpec[],
    signal: AbortSignal
  ): AsyncIterable<ThinkChunk>;
}

export type ThinkProvider = { baseUrl: string; apiKey?: string };

export class OpenAiCompatibleThink implements Think {
  constructor(
    private readonly provider: ThinkProvider,
    private readonly model: string,
    private readonly options: { temperature: number; maxTokens: number }
  ) {}

  async *stream(
    messages: ChatMessage[],
    tools: ToolSpec[],
    signal: AbortSignal
  ): AsyncIterable<ThinkChunk> {
    const body = {
      model: this.model,
      stream: true,
      temperature: this.options.temperature,
      max_tokens: this.options.maxTokens,
      messages: messages.map(toOpenAi),
      ...(tools.length
        ? { tools: tools.map((t) => ({ type: "function", function: t })) }
        : {})
    };
    const res = await fetch(
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
    if (!res.ok || !res.body)
      throw new Error(`language model answered HTTP ${res.status}`);

    const calls = new Map<number, ToolCall>();
    const decoder = new TextDecoder();
    let buffer = "";
    const reader = res.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;
        const delta = JSON.parse(data).choices?.[0]?.delta ?? {};
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
  }
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
