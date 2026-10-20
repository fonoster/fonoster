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
import type { UsageRow } from "@fonoster/types";

/** One line of the AI usage table: a vendor and model, what it did, how much, and whose key. */
export type AiUsageLine = {
  provider: string;
  model: string;
  usedFor: string;
  quantity: string;
  keySource: "workspace" | "platform";
};

export type UsageSummary = {
  empty: boolean;
  callMinutes: number;
  testMinutes: number;
  noiseCancellingMinutes: number;
  recordingMinutes: number;
  amdDetections: number;
  ai: AiUsageLine[];
  /** Peak bytes stored in the period, when any. */
  storageBytes?: number;
  /** Whether any vendor ran on the workspace's own key (the footnote). */
  ownKeys: boolean;
};

const USED_FOR: Record<string, string> = {
  stt: "Transcription",
  tts: "Speech",
  llm: "Language model",
  embedding: "Knowledge base",
  nc: "Noise cancelling"
};

const minutes = (seconds: number) => Math.round(seconds / 60);

/** 96K, 340K, 1.2M: short token counts. */
export function compact(n: number): string {
  if (n >= 1_000_000)
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString("en-US");
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1).replace(/\.0$/, "")} GB`;
  if (bytes >= 1e6) return `${Math.round(bytes / 1e6)} MB`;
  return `${Math.round(bytes / 1e3)} KB`;
}

/**
 * The Usage page's figures from GetUsage rows grouped by key source, origin, provider and model
 * (usage-metering, dashboard "Usage page"). Quantities only; calls and browser tests apart.
 */
export function summarize(rows: UsageRow[]): UsageSummary {
  const sum = (meter: string, keep: (r: UsageRow) => boolean = () => true) =>
    rows
      .filter((r) => r.meter === meter && keep(r))
      .reduce((n, r) => n + r.quantity, 0);
  const storage = rows
    .filter((r) => r.meter === "storage.bytes")
    .map((r) => r.quantity);

  // One AI line per vendor, model and key source; the token meters of a model share a line.
  const groups = new Map<
    string,
    { line: Omit<AiUsageLine, "quantity">; q: Record<string, number> }
  >();
  rows
    .filter((r) => r.keySource && r.meter !== "call.seconds")
    .forEach((r) => {
      const kind = r.meter.split(".")[0];
      const key = [kind, r.provider, r.model, r.keySource].join("|");
      const g = groups.get(key) ?? {
        line: {
          provider: r.provider,
          model: r.model || r.provider,
          usedFor: USED_FOR[kind] ?? kind,
          keySource: r.keySource as AiUsageLine["keySource"]
        },
        q: {}
      };
      g.q[r.meter] = (g.q[r.meter] ?? 0) + r.quantity;
      groups.set(key, g);
    });
  const quantity = (q: Record<string, number>) => {
    if (q["stt.seconds"] !== undefined)
      return `${minutes(q["stt.seconds"]).toLocaleString("en-US")} min`;
    if (q["nc.seconds"] !== undefined)
      return `${minutes(q["nc.seconds"]).toLocaleString("en-US")} min`;
    if (q["tts.characters"] !== undefined)
      return `${q["tts.characters"].toLocaleString("en-US")} characters`;
    if (q["embedding.tokens"] !== undefined)
      return `${compact(q["embedding.tokens"])} tokens`;
    return [
      `${compact(q["llm.tokens.in"] ?? 0)} in`,
      `${compact(q["llm.tokens.out"] ?? 0)} out`,
      ...(q["llm.tokens.cached"]
        ? [`${compact(q["llm.tokens.cached"])} cached`]
        : [])
    ].join(" · ");
  };
  const ai = [...groups.values()].map((g) => ({
    ...g.line,
    quantity: quantity(g.q)
  }));

  return {
    empty: rows.length === 0,
    callMinutes: minutes(
      sum("call.seconds", (r) => r.origin !== "browser_test")
    ),
    testMinutes: minutes(
      sum("call.seconds", (r) => r.origin === "browser_test")
    ),
    noiseCancellingMinutes: minutes(sum("nc.seconds")),
    recordingMinutes: minutes(sum("recording.seconds")),
    amdDetections: sum("amd.detections"),
    ai,
    storageBytes: storage.length ? Math.max(...storage) : undefined,
    ownKeys: ai.some((l) => l.keySource === "workspace")
  };
}

/** The last 12 months, newest first, as GetUsage day ranges (UTC). */
export function recentMonths(now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const first = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    const last = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)
    );
    return {
      value: first.toISOString().slice(0, 7),
      label: first.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
        timeZone: "UTC"
      }),
      fromDay: first.toISOString().slice(0, 10),
      toDay: last.toISOString().slice(0, 10)
    };
  });
}
