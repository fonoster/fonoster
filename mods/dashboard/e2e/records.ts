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
 * Call records served from the records API (/api/records) the way the apiserver
 * serves them, built from the call-record module's own fixture calls with its own
 * vCon builder, so the dashboard reads real vCons rather than hand-made shapes.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildVcon } from "../../callrecord/src/vcon";
import type { GrpcWebMock, RestReply } from "./grpc-web";

const FIXTURES = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../callrecord/test/fixtures/calls"
);

type FixtureEntry = {
  atMs: number;
  source: string;
  message: Record<string, unknown>;
};

/** A 16 kHz mono WAV of silence, `ms` long. */
export function wav(ms: number) {
  const samples = Math.round((16000 * ms) / 1000);
  const data = Buffer.alloc(samples * 2);
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(16000, 24);
  header.writeUInt32LE(32000, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

export type RecordFixture = {
  callRef: string;
  /** The search row (the router's view of the index entry). */
  summary: Record<string, unknown>;
  /** GET /api/records/:callRef, or an error status and body. */
  detail: RestReply;
  /** GET /api/records/:callRef/recording. */
  recording: RestReply;
};

const DEFAULT_T0 = Date.parse("2026-10-20T14:05:00Z");

/**
 * Builds a record from a call-record fixture file. `extra` entries are appended (e.g. a
 * filter.failed event); `recordedMs` serves a WAV of that length as the recording.
 */
export function fromFixture(
  name: string,
  options: {
    callRef?: string;
    appRef?: string;
    extra?: FixtureEntry[];
    recordedMs?: number;
    /** When the call started (default 2026-10-20 14:05 UTC). */
    startedAt?: number;
  } = {}
): RecordFixture {
  const file = JSON.parse(
    readFileSync(join(FIXTURES, `${name}.json`), "utf8")
  ) as {
    callRef: string;
    entries: FixtureEntry[];
    expect: { status: string };
  };
  const callRef = options.callRef ?? file.callRef;
  const T0 = options.startedAt ?? DEFAULT_T0;
  const entries = [...file.entries, ...(options.extra ?? [])]
    .sort((a, b) => a.atMs - b.atMs)
    .map((e) => ({
      at: T0 + e.atMs,
      source: e.source,
      message: {
        ...e.message,
        ...(e.message.callRef ? { callRef } : {})
      } as Record<string, unknown>
    }));
  const audio = options.recordedMs ? wav(options.recordedMs) : undefined;
  const built = buildVcon(callRef, entries as never, {
    region: "default",
    ...(audio
      ? {
          recording: {
            part: {
              name: "recording.wav",
              mimetype: "audio/x-wav",
              data: audio
            },
            startedAt: T0 + 200,
            durationMs: options.recordedMs!,
            // Nothing to redact in these fixtures: the redacted copy keeps the same recording.
            beep: () => ({
              name: "recording.wav",
              mimetype: "audio/x-wav",
              data: audio
            })
          }
        }
      : {})
  });
  const started =
    entries.find((e) => e.message.type === "call.started")?.message ?? {};
  const ended = entries.find((e) => e.message.type === "call.ended");
  const last = entries[entries.length - 1];
  const endedAt = ended?.at ?? last.at;
  const meta =
    (built.vcon as { fonoster?: Record<string, unknown> }).fonoster ?? {};
  const summary = {
    callRef,
    appRef: options.appRef ?? (started.appRef as string) ?? null,
    from: (started.from as string) ?? null,
    to: (started.to as string) ?? null,
    direction: (started.direction as string) ?? "inbound",
    status: file.expect.status,
    endReason:
      (meta.endReason as string) ?? (ended?.message.reason as string) ?? null,
    // As the index has them (callrecord indexEntry): from the vCon's failure.
    failureReason:
      (meta.failure as { reason?: string } | undefined)?.reason ?? null,
    sipStatus:
      (meta.failure as { sipStatus?: number } | undefined)?.sipStatus ?? null,
    startedAt: new Date(T0).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    durationSeconds: Math.round((endedAt - T0) / 1000),
    region: "default",
    version: 1,
    size: 1024,
    parts: built.parts.map((p) => p.name)
  };
  return {
    callRef,
    summary,
    detail: {
      json: {
        ...summary,
        currentVersion: 1,
        redacted: true,
        vcon: built.redacted,
        jws: {}
      }
    },
    recording: audio
      ? {
          body: audio,
          headers: {
            "content-type": "audio/x-wav",
            "x-content-hash": "sha512-e2e"
          }
        }
      : { status: 404, json: { error: "no_recording" } }
  };
}

/** An Autopilot turn note (autopilot.turn) naming the tools the agent called. */
export const toolTurn = (
  atMs: number,
  toolCalls: { name: string; ok: boolean }[]
): FixtureEntry => ({
  atMs,
  source: "app",
  message: { type: "record.note", data: { kind: "autopilot.turn", toolCalls } }
});

/** The call's usage as AppBridge snapshots it (add-usage-metering). */
export const usageSnapshot = (
  atMs: number,
  lines: Record<string, unknown>[]
): FixtureEntry => ({
  atMs,
  source: "event",
  message: { type: "usage.snapshot", lines }
});

/**
 * Serves these records: the search (filtered by status, direction and app, newest first, `pageSize` at a time with
 * a page token), each record and its recording.
 */
export function installRecords(
  api: GrpcWebMock,
  records: RecordFixture[],
  options: { pageSize?: number } = {}
) {
  const byRef = new Map(records.map((r) => [r.callRef, r]));
  const pageSize = options.pageSize ?? 50;
  api
    .rest("GET", "/api/records", ({ query }) => {
      const status = query.get("status");
      const direction = query.get("direction");
      const appRef = query.get("appRef");
      const matching = records
        .map((r) => r.summary)
        .filter((s) => !status || s.status === status)
        .filter((s) => !direction || s.direction === direction)
        .filter((s) => !appRef || s.appRef === appRef)
        .sort((a, b) => String(b.startedAt).localeCompare(String(a.startedAt)));
      const from = Number(query.get("pageToken") ?? 0);
      const page = matching.slice(from, from + pageSize);
      const next =
        from + pageSize < matching.length ? String(from + pageSize) : null;
      return { json: { items: page, nextPageToken: next } };
    })
    .rest("GET", "/api/records/:callRef", ({ params }) => {
      const record = byRef.get(params.callRef);
      return record
        ? record.detail
        : { status: 404, json: { error: "not_found" } };
    })
    .rest("GET", "/api/records/:callRef/recording", ({ params }) => {
      const record = byRef.get(params.callRef);
      return record
        ? record.recording
        : { status: 404, json: { error: "not_found" } };
    });
}
