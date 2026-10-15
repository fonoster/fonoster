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
import { URL } from "url";
import { AnalyticsSink, CallMetrics } from "./analytics";

// The ClickHouse analytics sink (add-call-record task 6.1, build log LO-B6) over ClickHouse's HTTP
// interface, so no client library is needed. One row per call in a ReplacingMergeTree keyed by
// call id: loading a record again replaces its row (the newest `loaded_at` wins); read with FINAL.

export type ClickHouseConfig = {
  /** HTTP interface, e.g. http://clickhouse:8123 */
  url: string;
  database?: string;
  table?: string;
  user?: string;
  password?: string;
  /** Per-request timeout (default 10 s). */
  timeoutMs?: number;
};

const IDENT = /^[A-Za-z_][A-Za-z0-9_]{0,63}$/;

export class ClickHouseError extends Error {}

export class ClickHouseAnalyticsSink implements AnalyticsSink {
  readonly database: string;
  readonly table: string;
  private ready?: Promise<void>;

  constructor(private readonly config: ClickHouseConfig) {
    this.database = config.database ?? "fonoster";
    this.table = config.table ?? "call_metrics";
    if (!IDENT.test(this.database) || !IDENT.test(this.table))
      throw new ClickHouseError("invalid ClickHouse database or table name");
  }

  get qualified() {
    return `${this.database}.${this.table}`;
  }

  /** Runs one statement; `params` become ClickHouse query parameters ({name:Type}). */
  async query(
    sql: string,
    options: { body?: string; params?: Record<string, string> } = {}
  ): Promise<string> {
    const url = new URL(this.config.url);
    const body = options.body === undefined ? sql : options.body;
    if (options.body !== undefined) url.searchParams.set("query", sql);
    url.searchParams.set("date_time_input_format", "best_effort");
    for (const [k, v] of Object.entries(options.params ?? {}))
      url.searchParams.set(`param_${k}`, v);
    const headers: Record<string, string> = {
      "content-type": "text/plain; charset=utf-8"
    };
    if (this.config.user) headers["x-clickhouse-user"] = this.config.user;
    if (this.config.password)
      headers["x-clickhouse-key"] = this.config.password;
    const res = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(this.config.timeoutMs ?? 10_000)
    });
    const text = await res.text();
    if (!res.ok)
      throw new ClickHouseError(
        `ClickHouse ${res.status}: ${text.trim().split("\n")[0].slice(0, 300)}`
      );
    return text;
  }

  /** Creates the database and table if missing (idempotent; runs once per sink). */
  ensureSchema(): Promise<void> {
    this.ready ??= (async () => {
      await this.query(`CREATE DATABASE IF NOT EXISTS ${this.database}`);
      await this.query(`CREATE TABLE IF NOT EXISTS ${this.qualified} (
        call_ref String,
        workspace_ref Nullable(String),
        app_ref Nullable(String),
        status LowCardinality(String),
        started_at DateTime64(3, 'UTC'),
        duration_seconds UInt32,
        caller_turns UInt32,
        agent_turns UInt32,
        interruptions UInt32,
        false_cutoffs UInt32,
        has_recording UInt8,
        loaded_at DateTime64(3, 'UTC')
      ) ENGINE = ReplacingMergeTree(loaded_at)
      ORDER BY call_ref`);
    })().catch((e) => {
      this.ready = undefined;
      throw e;
    });
    return this.ready;
  }

  async drop() {
    await this.ensureSchema();
    await this.query(`TRUNCATE TABLE ${this.qualified}`);
  }

  async upsert(row: CallMetrics) {
    await this.upsertMany([row]);
  }

  async upsertMany(rows: CallMetrics[]) {
    if (!rows.length) return;
    await this.ensureSchema();
    const loadedAt = new Date().toISOString();
    const body = rows
      .map((r) =>
        JSON.stringify({
          call_ref: r.callRef,
          workspace_ref: r.workspaceRef,
          app_ref: r.appRef,
          status: r.status,
          started_at: r.startedAt,
          duration_seconds: r.durationSeconds,
          caller_turns: r.callerTurns,
          agent_turns: r.agentTurns,
          interruptions: r.interruptions,
          false_cutoffs: r.falseCutoffs,
          has_recording: r.hasRecording ? 1 : 0,
          loaded_at: loadedAt
        })
      )
      .join("\n");
    await this.query(`INSERT INTO ${this.qualified} FORMAT JSONEachRow`, {
      body
    });
  }

  /** Removes an erased call's row (lightweight delete). */
  async remove(callRef: string) {
    await this.ensureSchema();
    await this.query(
      `DELETE FROM ${this.qualified} WHERE call_ref = {callRef:String}`,
      { params: { callRef } }
    );
  }

  /** The current rows (FINAL: one per call), for checks and the rebuild report. */
  async rows(): Promise<CallMetrics[]> {
    await this.ensureSchema();
    const text = await this.query(
      `SELECT * FROM ${this.qualified} FINAL ORDER BY call_ref FORMAT JSONEachRow`
    );
    return text
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const r = JSON.parse(l);
        return {
          callRef: r.call_ref,
          workspaceRef: r.workspace_ref,
          appRef: r.app_ref,
          status: r.status,
          startedAt: new Date(
            `${r.started_at.replace(" ", "T")}Z`
          ).toISOString(),
          durationSeconds: Number(r.duration_seconds),
          callerTurns: Number(r.caller_turns),
          agentTurns: Number(r.agent_turns),
          interruptions: Number(r.interruptions),
          falseCutoffs: Number(r.false_cutoffs),
          hasRecording: Number(r.has_recording) === 1
        };
      });
  }
}
