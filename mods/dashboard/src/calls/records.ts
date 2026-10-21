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
 * How call records (the records API's index rows and vCons) read on the Calls page.
 */
import type { CallRecordSummary, Turn, UsageLine } from "~/session/types";
import { formatNumber } from "~/lib/format";
import { callDirection, csvCell, type Tone } from "./format";

/** The index's direction, or a call detail record's enum name. */
export const recordDirection = callDirection;

const FAILED: Record<string, { label: string; tone: Tone }> = {
  busy: { label: "Busy", tone: "warning" },
  no_answer: { label: "No answer", tone: "muted" },
  rejected: { label: "Rejected", tone: "error" }
};

/** The status word and dot: a failed call says why when the reason has a word. */
export function recordStatus(
  call: Pick<CallRecordSummary, "status" | "failureReason">
): { label: string; tone: Tone } {
  switch (call.status) {
    case "completed":
      return { label: "Completed", tone: "success" };
    case "incomplete":
      return { label: "Incomplete", tone: "warning" };
    case "erased":
      return { label: "Erased", tone: "muted" };
    case "failed":
      return (
        FAILED[call.failureReason ?? ""] ?? {
          label: "Failed",
          tone: "error"
        }
      );
    default:
      return { label: call.status || "Unknown", tone: "muted" };
  }
}

/**
 * The outside party and the workspace's own number. A browser test call is addressed to the
 * agent's ref, which is not a number: it has no Fonoster number.
 */
export function recordParties(
  call: Pick<CallRecordSummary, "from" | "to" | "direction" | "appRef">
) {
  const outbound = recordDirection(call.direction) === "outbound";
  const customer = outbound ? call.to : call.from;
  const own = outbound ? call.from : call.to;
  return {
    customer: customer ? formatNumber(customer) : "Unknown",
    fonosterNumber: own && own !== call.appRef ? formatNumber(own) : ""
  };
}

const ANSWERED: Record<string, string> = {
  human: "Human",
  voicemail: "Voicemail",
  machine: "Machine",
  ivr: "IVR"
};

/** Who answered, by AMD, in a word; undefined when AMD didn't run or couldn't tell. */
export function answeredByWord(amdStatus?: string): string | undefined {
  return amdStatus ? ANSWERED[amdStatus] : undefined;
}

/** Milliseconds as a clock: 0:00, 0:24, 2:05, 1:02:09. */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

/** The middle value (the lower one of an even count), or undefined for none. */
export function median(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/** The agent turns that answered the caller, with how long the caller waited. */
export function responseTimes(turns: Turn[]) {
  return turns
    .filter((t) => t.side === "agent" && t.firstAudioMs !== undefined)
    .map((t, i) => ({ turn: i + 1, ms: t.firstAudioMs! }));
}

const METER: Record<string, { label: string; unit: string }> = {
  "call.seconds": { label: "Telephony", unit: "s" },
  "stt.seconds": { label: "Speech-to-text", unit: "s" },
  "tts.characters": { label: "Text-to-speech", unit: "chars" },
  "llm.tokens.in": { label: "LLM input", unit: "tokens" },
  "llm.tokens.out": { label: "LLM output", unit: "tokens" },
  "llm.tokens.cached": { label: "LLM cached", unit: "tokens" },
  "embedding.tokens": { label: "Embeddings", unit: "tokens" },
  "nc.seconds": { label: "Noise cancelling", unit: "s" },
  "amd.detections": { label: "Machine detection", unit: "" },
  "amd.seconds": { label: "Machine detection", unit: "s" },
  "recording.seconds": { label: "Recording", unit: "s" },
  "storage.bytes": { label: "Storage", unit: "bytes" }
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1
});

/** A usage line as "Speech-to-text · Deepgram" and "42 s". */
export function usageRow(line: UsageLine) {
  const meter = METER[line.meter] ?? { label: line.meter, unit: "" };
  const by = line.model || line.provider;
  const amount =
    meter.unit === "s"
      ? clock(line.quantity * 1000)
      : `${compact.format(line.quantity)}${meter.unit ? ` ${meter.unit}` : ""}`;
  return { label: by ? `${meter.label} · ${by}` : meter.label, amount };
}

/** How a call ended, in words (the record's end reason or failure reason). */
const ENDED: Record<string, string> = {
  caller_hangup: "The caller hung up",
  app_hangup: "The app hung up",
  agent_hangup: "The agent hung up",
  busy: "The line was busy",
  no_answer: "No one answered",
  rejected: "The call was rejected",
  app_unreachable: "The app couldn't be reached",
  no_app: "No app was set for the number",
  node_error: "The media node failed",
  max_duration: "It reached the maximum call length",
  transferred: "It was transferred"
};

export function endedText(reason?: string, sipStatus?: number): string {
  const text = reason
    ? (ENDED[reason] ?? reason.replace(/_/g, " "))
    : "It's unknown how the call ended";
  return sipStatus ? `${text} (SIP ${sipStatus})` : text;
}

const CSV_FIELDS = [
  "callRef",
  "startedAt",
  "direction",
  "handledBy",
  "appRef",
  "customer",
  "fonosterNumber",
  "durationSeconds",
  "status",
  "failureReason",
  "sipStatus",
  "endReason",
  "answeredBy"
] as const;

/** The listed records as CSV, one row per call. */
export function recordsToCsv(
  calls: CallRecordSummary[],
  appName: (ref: string) => string | undefined
): string {
  const rows = calls.map((call) => {
    const outbound = recordDirection(call.direction) === "outbound";
    const values: Record<(typeof CSV_FIELDS)[number], unknown> = {
      callRef: call.callRef,
      startedAt: call.startedAt,
      direction: recordDirection(call.direction),
      handledBy: appName(call.appRef) ?? "",
      appRef: call.appRef,
      customer: outbound ? call.to : call.from,
      fonosterNumber: outbound ? call.from : call.to,
      durationSeconds: Math.round(call.durationMs / 1000),
      status: call.status,
      failureReason: call.failureReason ?? "",
      sipStatus: call.sipStatus ?? "",
      endReason: call.endReason ?? "",
      answeredBy: call.amdStatus ?? ""
    };
    return CSV_FIELDS.map((f) => csvCell(values[f])).join(",");
  });
  return [CSV_FIELDS.join(","), ...rows].join("\n") + "\n";
}
