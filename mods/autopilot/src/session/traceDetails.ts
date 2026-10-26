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
/*
 * Tool call and knowledge search details for the turn trace (#1067). Everything is written as
 * text: the call record redacts every string of the app notes in its redacted copy (call-record
 * "Redacted copies protect personal data"), so a card number in a tool's parameters or response
 * is masked like one in the transcript. Text is capped so a record doesn't bloat, and a cut never
 * leaves part of a number behind (the redaction only recognizes whole ones). The tool's URL and
 * headers are never recorded: they hold the tenant's credentials.
 */
import { KnowledgePassage } from "./knowledge";
import { ToolOutcome } from "./tools";

/** Tool parameters, responses and errors are cut at this many characters. */
export const MAX_TOOL_TEXT = 2048;
/** Knowledge queries and passages are cut at this many characters. */
export const MAX_KNOWLEDGE_TEXT = 500;
/** At most this many passages are kept per knowledge search. */
export const MAX_PASSAGES = 3;

/** One tool call of a turn. */
export type ToolCallTrace = {
  name: string;
  ok: boolean;
  /** When the call started, in ms since the epoch (orders it within the turn). */
  startedAtMs?: number;
  /** HTTP tools: the method and the response status. */
  method?: string;
  status?: number;
  durationMs?: number;
  /** JSON, capped. */
  parameters?: string;
  response?: string;
  error?: string;
};

/** One knowledge search of a turn: the passages found for the caller's words. */
export type KnowledgeSearchTrace = {
  query: string;
  /** At most MAX_PASSAGES, best first; the first one's `source` is the top match's document. */
  passages: KnowledgePassage[];
  /** When the search started, in ms since the epoch (orders it within the turn). */
  startedAtMs?: number;
  durationMs: number;
  /** The search took longer than a reply waits for; the reply went without it. */
  timedOut?: boolean;
  /** The search failed; the reply went without it. `error` is the message, short. */
  failed?: boolean;
  error?: string;
};

/** A failed knowledge search's error is cut at this many characters. */
export const MAX_KNOWLEDGE_ERROR = 200;
/** A trailing run of at least this many digits could be part of a card number. */
const CARD_DIGITS = 13;

const DIGIT_WORDS =
  "zero|oh|one|two|three|four|five|six|seven|eight|nine|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve";
const DIGIT = `(?:\\d|\\b(?:${DIGIT_WORDS})\\b)`;
// A run of digits or digit words at the end of the text, and at the start, with their separators.
const TRAILING_NUMBER = new RegExp(`(?:[\\s,.-]*${DIGIT})+[\\s,.-]*$`, "i");
const LEADING_NUMBER = new RegExp(`^(?:[\\s,.-]*${DIGIT})+`, "i");
const DIGITS = new RegExp(DIGIT, "gi");

const digitCount = (text: string) => text.match(DIGITS)?.length ?? 0;

/**
 * Caps text at `max` characters, ending with an ellipsis. A run of digits or digit words cut at
 * the end is dropped when, with what follows the cut, it is long enough to be part of a card
 * number (the redaction only recognizes whole ones); amounts and ordinary words stay.
 */
export function capText(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const trailing = head.match(TRAILING_NUMBER)?.[0] ?? "";
  const continued = text.slice(max).match(LEADING_NUMBER)?.[0] ?? "";
  const run = digitCount(trailing) + digitCount(continued);
  const kept =
    trailing && run >= CARD_DIGITS ? head.slice(0, -trailing.length) : head;
  return `${kept}…`;
}

function json(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value) ?? "";
  } catch {
    return String(value);
  }
}

/** The trace entry for a tool the model called. */
export function toolCallTrace(
  name: string,
  args: Record<string, unknown>,
  outcome: ToolOutcome,
  startedAtMs: number,
  durationMs: number
): ToolCallTrace {
  return {
    name,
    ok: outcome.ok,
    startedAtMs,
    ...(outcome.method ? { method: outcome.method } : {}),
    ...(outcome.status !== undefined ? { status: outcome.status } : {}),
    durationMs,
    ...(Object.keys(args).length
      ? { parameters: capText(json(args), MAX_TOOL_TEXT) }
      : {}),
    ...(outcome.ok && outcome.result !== undefined
      ? { response: capText(json(outcome.result), MAX_TOOL_TEXT) }
      : {}),
    ...(!outcome.ok && outcome.error
      ? { error: capText(outcome.error, MAX_TOOL_TEXT) }
      : {})
  };
}

/** The trace entry for a knowledge search: what it found, or that it timed out or failed. */
export function knowledgeSearchTrace(
  query: string,
  found:
    { passages: KnowledgePassage[] } | { timedOut: true } | { error: unknown },
  startedAtMs: number,
  durationMs: number
): KnowledgeSearchTrace {
  const passages = "passages" in found ? found.passages : [];
  const error =
    "error" in found
      ? capText(
          (found.error as Error)?.message ?? String(found.error),
          MAX_KNOWLEDGE_ERROR
        )
      : undefined;
  return {
    query: capText(query, MAX_KNOWLEDGE_TEXT),
    passages: passages.slice(0, MAX_PASSAGES).map((p) => ({
      text: capText(p.text, MAX_KNOWLEDGE_TEXT),
      ...(p.source ? { source: p.source } : {}),
      ...(p.score !== undefined ? { score: p.score } : {})
    })),
    startedAtMs,
    durationMs,
    ...("timedOut" in found ? { timedOut: true } : {}),
    ...("error" in found ? { failed: true, ...(error ? { error } : {}) } : {})
  };
}

/**
 * The turn as the log sees it when there is no call record: tool names, outcomes, counts and
 * durations only. Parameters, responses, errors, queries and passages stay out of the logs.
 */
export function loggedTurn<
  T extends {
    toolCalls: ToolCallTrace[];
    knowledgeSearches?: KnowledgeSearchTrace[];
  }
>(trace: T) {
  return {
    ...trace,
    toolCalls: trace.toolCalls.map((c) => ({
      name: c.name,
      ok: c.ok,
      ...(c.status !== undefined ? { status: c.status } : {}),
      ...(c.durationMs !== undefined ? { durationMs: c.durationMs } : {})
    })),
    ...(trace.knowledgeSearches
      ? {
          knowledgeSearches: trace.knowledgeSearches.map((k) => ({
            passages: k.passages.length,
            durationMs: k.durationMs,
            ...(k.timedOut ? { timedOut: true } : {}),
            ...(k.failed ? { failed: true } : {})
          }))
        }
      : {})
  };
}
