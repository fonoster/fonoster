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
  /** Where the top match came from (a document name), when the port says. */
  source?: string;
  passages: KnowledgePassage[];
  durationMs: number;
  /** The search took longer than a reply waits for; the reply went without it. */
  timedOut?: boolean;
};

const DIGIT_WORDS =
  "zero|oh|one|two|three|four|five|six|seven|eight|nine|cero|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve";
// A run of digits or digit words at the end of the text, with their separators.
const TRAILING_NUMBER = new RegExp(
  `(?:[\\s,.-]*(?:\\d|\\b(?:${DIGIT_WORDS})\\b))+[\\s,.-]*$`,
  "i"
);

/** Caps text at `max` characters, ending with an ellipsis and no partial number. */
export function capText(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(TRAILING_NUMBER, "")}…`;
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
  durationMs: number
): ToolCallTrace {
  return {
    name,
    ok: outcome.ok,
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

/** The trace entry for a knowledge search. */
export function knowledgeSearchTrace(
  query: string,
  passages: KnowledgePassage[],
  durationMs: number,
  timedOut = false
): KnowledgeSearchTrace {
  const kept = passages.slice(0, MAX_PASSAGES).map((p) => ({
    text: capText(p.text, MAX_KNOWLEDGE_TEXT),
    ...(p.source ? { source: p.source } : {}),
    ...(p.score !== undefined ? { score: p.score } : {})
  }));
  return {
    query: capText(query, MAX_KNOWLEDGE_TEXT),
    ...(kept[0]?.source ? { source: kept[0].source } : {}),
    passages: kept,
    durationMs,
    ...(timedOut ? { timedOut: true } : {})
  };
}
