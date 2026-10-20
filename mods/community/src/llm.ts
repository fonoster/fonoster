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
// The LLM adapter interface (rework-autopilot A8: the Think plug): a streaming language model
// behind one interface. Implementations live in one subpath per vendor (openai covers
// OpenAI, Groq, Ollama and the conformance fake LLM).

export type ToolCall = { id: string; name: string; arguments: string };

export type ChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

/** Token counts as the vendor reports them for one request (add-usage-metering). */
export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  /** Input tokens served from the vendor's prompt cache (part of inputTokens). */
  cachedTokens: number;
};

/**
 * A stream ends with at most one `usage` chunk, after the text and tool calls, when the vendor
 * reports usage. Its absence means the vendor reported none (or the stream was cut short).
 */
export type ThinkChunk =
  | { type: "text"; text: string }
  | { type: "tool_calls"; calls: ToolCall[] }
  | { type: "usage"; usage: TokenUsage };

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

/**
 * A language model vendor failed, named like the session error codes (registry "vendor errors
 * map to provider_unavailable", task 1.5): unreachable or 401/403/429/5xx → provider_unavailable,
 * 400/422 → bad_message. An abort is not a provider error and is rethrown as it is.
 */
export class ThinkError extends Error {
  constructor(
    readonly code: "provider_unavailable" | "provider_timeout" | "bad_message",
    message: string
  ) {
    super(message);
    this.name = "ThinkError";
  }
}
