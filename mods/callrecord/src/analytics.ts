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
import { decodeVcon } from "./sign";
import { RecordStore } from "./storage";
import { Vcon } from "./types";

// The analytics store is derived from sealed records only (design V9) and can be dropped and
// rebuilt from them at any time. This is the loader contract plus the per-call row it fills;
// `ClickHouseAnalyticsSink` (clickhouse.ts) is the production sink.

/** One call's row in the analytics store, derived from its (redacted) vCon. */
export type CallMetrics = {
  callRef: string;
  workspaceRef: string | null;
  appRef: string | null;
  status: string;
  startedAt: string;
  durationSeconds: number;
  callerTurns: number;
  agentTurns: number;
  interruptions: number;
  falseCutoffs: number;
  hasRecording: boolean;
};

export interface AnalyticsSink {
  /** Drops every row (the first step of a rebuild). */
  drop(): Promise<void>;
  /** Inserts or replaces one call's row. */
  upsert(row: CallMetrics): Promise<void>;
  /** Inserts or replaces many rows at once (used by rebuilds when present). */
  upsertMany?(rows: CallMetrics[]): Promise<void>;
  /** Removes an erased call's row. */
  remove?(callRef: string): Promise<void>;
}

export class MemoryAnalyticsSink implements AnalyticsSink {
  readonly rows = new Map<string, CallMetrics>();
  async drop() {
    this.rows.clear();
  }
  async upsert(row: CallMetrics) {
    this.rows.set(row.callRef, row);
  }
  async remove(callRef: string) {
    this.rows.delete(callRef);
  }
}

export function callMetrics(vcon: Vcon): CallMetrics {
  const f = (vcon.fonoster ?? {}) as Record<string, unknown>;
  const text = vcon.dialog.filter((d) => d.type === "text");
  const startedAt = String(f.startedAt ?? vcon.created_at);
  const endedAt = f.endedAt ? String(f.endedAt) : undefined;
  const decisions =
    (vcon.analysis.find((a) => a.type === "turn_decisions")?.body as
      Record<string, unknown>[] | undefined) ?? [];
  return {
    callRef: String(f.callRef ?? vcon.uuid),
    workspaceRef: (f.workspaceRef as string) ?? null,
    appRef: ((f.appRefs as string[]) ?? [])[0] ?? null,
    status: String(f.status ?? "completed"),
    startedAt,
    durationSeconds: endedAt
      ? Math.max(
          0,
          Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000)
        )
      : 0,
    callerTurns: text.filter((d) => d.originator === 0).length,
    agentTurns: text.filter((d) => d.originator !== 0).length,
    interruptions: text.filter(
      (d) => (d.meta as { interrupted?: boolean } | undefined)?.interrupted
    ).length,
    falseCutoffs: decisions.filter(
      (d) => d.falseCutoff === true || d.outcome === "false_cutoff"
    ).length,
    hasRecording: vcon.dialog.some((d) => d.type === "recording" && d.url)
  };
}

/** Loads one sealed record into the store (called when a record is sealed). */
export async function loadRecord(
  store: RecordStore,
  sink: AnalyticsSink,
  callRef: string
) {
  const row = await metricsOf(store, callRef);
  if (row === "erased") {
    // An erased call leaves no trace in analytics either.
    await sink.remove?.(callRef);
    return false;
  }
  if (!row) return false;
  await sink.upsert(row);
  return true;
}

async function metricsOf(
  store: RecordStore,
  callRef: string
): Promise<CallMetrics | "erased" | undefined> {
  const stored = await store.getVersion(callRef);
  // The redacted copy: analytics never sees unredacted text (design V5).
  if (!stored?.redacted) return undefined;
  const vcon = decodeVcon(stored.redacted);
  if ((vcon.fonoster as { status?: string } | undefined)?.status === "erased")
    return "erased";
  return callMetrics(vcon);
}

/** Drops the analytics store and refills it from every sealed record (task 6.2). */
export async function rebuildAnalytics(
  store: RecordStore,
  sink: AnalyticsSink,
  options: { drop?: boolean } = {}
): Promise<number> {
  // `drop: false` adds a further store (a workspace bucket) after the region's.
  if (options.drop !== false) await sink.drop();
  let n = 0;
  let batch: CallMetrics[] = [];
  const flush = async () => {
    if (!batch.length) return;
    if (sink.upsertMany) await sink.upsertMany(batch);
    else for (const row of batch) await sink.upsert(row);
    n += batch.length;
    batch = [];
  };
  for (const callRef of await store.listCalls()) {
    const row = await metricsOf(store, callRef);
    if (!row || row === "erased") continue;
    batch.push(row);
    if (batch.length >= 500) await flush();
  }
  await flush();
  return n;
}
