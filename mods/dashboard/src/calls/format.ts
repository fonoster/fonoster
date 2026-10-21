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
import type { CallDetailRecord } from "@fonoster/types";
import { formatNumber, toDate } from "~/lib/format";

/* Call records come from the API with enum names as strings. Compare with
 * literals: runtime imports from @fonoster/types break the browser build. */

export type Tone = "success" | "warning" | "error" | "muted";

/** How a hangup cause reads in the list, and the color of its dot. */
export function callStatus(status: string): { label: string; tone: Tone } {
  switch (status) {
    case "NORMAL_CLEARING":
      return { label: "Completed", tone: "success" };
    case "NO_ANSWER":
    case "NO_USER_RESPONSE":
      return { label: "No answer", tone: "muted" };
    case "USER_BUSY":
      return { label: "Busy", tone: "warning" };
    case "CALL_REJECTED":
      return { label: "Rejected", tone: "error" };
    default:
      return { label: "Failed", tone: "error" };
  }
}

/** The single statuses the API can filter by, as the status menu offers them. */
export const STATUS_FILTERS = [
  { value: "NORMAL_CLEARING", label: "Completed" },
  { value: "NO_ANSWER", label: "No answer" },
  { value: "USER_BUSY", label: "Busy" },
  { value: "CALL_REJECTED", label: "Rejected" }
];

export type Direction = "inbound" | "outbound" | "internal";

/** A call detail record's enum name, or the records index's word. */
export function callDirection(direction: string): Direction {
  if (direction === "TO_PSTN" || direction === "outbound") return "outbound";
  if (direction === "INTRA_NETWORK" || direction === "internal")
    return "internal";
  return "inbound";
}

export const DIRECTION_LABEL: Record<Direction, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  internal: "Internal"
};

/**
 * The outside party and the workspace's own number. Inbound calls come from
 * the customer to a Fonoster number; outbound ones go the other way.
 */
export function callParties(
  call: Pick<CallDetailRecord, "from" | "to" | "direction">
) {
  const outbound = callDirection(call.direction) === "outbound";
  return {
    customer: formatNumber(outbound ? call.to : call.from),
    fonosterNumber: formatNumber(outbound ? call.from : call.to)
  };
}

const AMD_LABEL: Record<string, string> = {
  HUMAN: "Human",
  MACHINE: "Machine",
  VOICEMAIL: "Voicemail",
  IVR: "IVR",
  UNKNOWN: "Unknown"
};

/** The answering machine verdict, or undefined when AMD didn't run. */
export function answeredBy(amdStatus?: string): string | undefined {
  return amdStatus ? AMD_LABEL[amdStatus] : undefined;
}

/** Seconds → "0:24", "2:05", "1:02:09"; "—" for calls that never connected. */
export function formatDuration(seconds: number | undefined): string {
  if (!seconds || seconds < 0) return "—";
  const s = Math.round(seconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const rest = String(s % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}`
    : `${minutes}:${rest}`;
}

const TIME = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23"
});
const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});
const DAY_YEAR = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric"
});

function sameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

/** "Today 14:31", "Yesterday 09:02", "Oct 2 18:40", "Dec 30, 2025 08:15". */
export function formatStarted(
  value: Date | number | string | null | undefined,
  now = new Date()
): string {
  const date = toDate(value);
  if (!date) return "—";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day = sameDay(date, now)
    ? "Today"
    : sameDay(date, yesterday)
      ? "Yesterday"
      : date.getFullYear() === now.getFullYear()
        ? DAY.format(date)
        : DAY_YEAR.format(date);
  return `${day} ${TIME.format(date)}`;
}

/** The date ranges the list offers, as days back from now. */
export const RANGES = [
  { value: "1", label: "Last 24 hours" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" }
];

/** The `after` bound of a range, as the ISO string the API expects. */
export function rangeStart(days: string, now = new Date()): string {
  return new Date(now.getTime() - Number(days) * 86_400_000).toISOString();
}

export function csvCell(value: unknown): string {
  const text =
    value instanceof Date ? value.toISOString() : String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const CSV_FIELDS: (keyof CallDetailRecord)[] = [
  "ref",
  "startedAt",
  "endedAt",
  "direction",
  "from",
  "to",
  "duration",
  "status",
  "type",
  "amdStatus"
];

/** The call records as CSV, one row per call, raw API values. */
export function callsToCsv(calls: CallDetailRecord[]): string {
  const rows = calls.map((call) =>
    CSV_FIELDS.map((field) =>
      csvCell(
        field === "startedAt" || field === "endedAt"
          ? toDate(call[field])
          : field === "amdStatus"
            ? (answeredBy(call.amdStatus) && call.amdStatus) || ""
            : call[field]
      )
    ).join(",")
  );
  return [CSV_FIELDS.join(","), ...rows].join("\n") + "\n";
}

/** Saves text as a file through a temporary link. */
export function download(filename: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
