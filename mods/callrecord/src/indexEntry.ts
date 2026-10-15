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
import { SealedVersion, Vcon } from "./types";

/**
 * What the control plane keeps about a record (design V2: call id, workspace, time, size,
 * location and current version), plus the few fields search and ListCalls need. Never contents.
 */
export type RecordIndexEntry = {
  callRef: string;
  workspaceRef: string | null;
  appRef: string | null;
  from: string | null;
  to: string | null;
  direction: string | null;
  status: string;
  endReason: string | null;
  failureReason: string | null;
  sipStatus: number | null;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  region: string;
  /** The store holding the record: `s3://bucket/prefix` or `file:///dir`. */
  location: string;
  version: number;
  /** Bytes of the stored vCons and parts. */
  size: number;
  /** Parts present in this version: recording, messages, transcript. */
  parts: string[];
};

/** NATS subject the gateway publishes index entries on; the control plane consumes it. */
export const RECORD_SEALED_SUBJECT = "callrecord.sealed";

export function indexEntry(
  callRef: string,
  sealed: SealedVersion,
  vcon: Vcon,
  where: { region: string; location: string }
): RecordIndexEntry {
  const f = (vcon.fonoster ?? {}) as Record<string, unknown>;
  const tel = (role: string) => {
    const p = vcon.parties.find((x) => x.role === role);
    return p?.tel ? String(p.tel) : null;
  };
  const startedAt = String(f.startedAt ?? vcon.created_at);
  const endedAt = (f.endedAt as string | null) ?? null;
  const failure = f.failure as
    | { reason?: string; sipStatus?: number }
    | undefined;
  const hasRecording = vcon.dialog.some((d) => d.type === "recording" && d.url);
  const hasTranscript = vcon.dialog.some((d) => d.type === "text");
  const hasMessages = vcon.attachments.some((a) => a.url);
  const size =
    sealed.parts.reduce((n, p) => n + p.data.length, 0) +
    sealed.signed.payload.length +
    sealed.redacted.payload.length;
  return {
    callRef,
    workspaceRef: (f.workspaceRef as string) ?? null,
    appRef: ((f.appRefs as string[]) ?? [])[0] ?? null,
    from: tel("caller"),
    to: tel("callee"),
    direction: (f.direction as string) ?? null,
    status: String(f.status ?? "completed"),
    endReason: (f.endReason as string) ?? null,
    failureReason: failure?.reason ?? null,
    sipStatus: failure?.sipStatus ?? null,
    startedAt,
    endedAt,
    durationSeconds: endedAt
      ? Math.max(
          0,
          Math.round((Date.parse(endedAt) - Date.parse(startedAt)) / 1000)
        )
      : 0,
    region: where.region,
    location: where.location,
    version: sealed.version,
    size,
    parts: [
      ...(hasRecording ? ["recording"] : []),
      ...(hasTranscript ? ["transcript"] : []),
      ...(hasMessages ? ["messages"] : [])
    ]
  };
}
