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
import { callDirection, callStatus } from "~/calls/format";
import { toDate } from "~/lib/format";

export type Range = "today" | "7d" | "30d";

export const RANGES: { value: Range; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" }
];

/** Where a range starts: local midnight for today, else N days back. */
export function rangeAfter(range: Range, now = new Date()): Date {
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  return new Date(now.getTime() - (range === "7d" ? 7 : 30) * 86_400_000);
}

export type Bucket = { label: string; inbound: number; outbound: number };

export type CallStats = {
  calls: number;
  minutes: number;
  /** Share of calls that ended normally, 0–1; undefined without calls. */
  answerRate?: number;
  /** Mean length of connected calls, in seconds. */
  averageDuration?: number;
  volume: Bucket[];
  /** Ended reasons, most common first, as shares of all calls. */
  reasons: { label: string; tone: string; count: number; share: number }[];
};

const HOUR = new Intl.DateTimeFormat("en-US", { hour: "numeric" });
const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric"
});

/** Empty buckets for the range: hours of today, or days back to the start. */
function buckets(range: Range, now: Date) {
  const keys: { key: string; label: string }[] = [];
  if (range === "today") {
    for (let hour = 0; hour <= now.getHours(); hour++) {
      const at = new Date(now);
      at.setHours(hour, 0, 0, 0);
      keys.push({ key: `h${hour}`, label: HOUR.format(at) });
    }
  } else {
    const days = range === "7d" ? 7 : 30;
    for (let back = days - 1; back >= 0; back--) {
      const at = new Date(now);
      at.setDate(now.getDate() - back);
      keys.push({ key: at.toDateString(), label: DAY.format(at) });
    }
  }
  return keys;
}

/** Totals, volume over time and ended reasons, computed from call records. */
export function callStats(
  calls: CallDetailRecord[],
  range: Range,
  now = new Date()
): CallStats {
  const slots = buckets(range, now);
  const volume = new Map(
    slots.map((slot) => [
      slot.key,
      { label: slot.label, inbound: 0, outbound: 0 }
    ])
  );
  const reasons = new Map<
    string,
    { label: string; tone: string; count: number }
  >();
  let seconds = 0;
  let connected = 0;
  let completed = 0;

  for (const call of calls) {
    const duration = call.duration > 0 ? call.duration : 0;
    seconds += duration;
    if (duration > 0) connected++;
    if (call.status === "NORMAL_CLEARING") completed++;

    const status = callStatus(call.status);
    const reason = reasons.get(status.label) ?? { ...status, count: 0 };
    reason.count++;
    reasons.set(status.label, reason);

    const started = toDate(call.startedAt);
    if (!started) continue;
    const key =
      range === "today" ? `h${started.getHours()}` : started.toDateString();
    const bucket = volume.get(key);
    if (!bucket) continue;
    if (callDirection(call.direction) === "outbound") bucket.outbound++;
    else bucket.inbound++;
  }

  return {
    calls: calls.length,
    minutes: Math.round(seconds / 60),
    answerRate: calls.length ? completed / calls.length : undefined,
    averageDuration: connected ? seconds / connected : undefined,
    volume: [...volume.values()],
    reasons: [...reasons.values()]
      .sort((a, b) => b.count - a.count)
      .map((reason) => ({ ...reason, share: reason.count / calls.length }))
  };
}
