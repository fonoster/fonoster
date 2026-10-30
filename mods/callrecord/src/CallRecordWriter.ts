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
import { randomUUID } from "crypto";
import * as path from "path";
import { getLogger } from "@fonoster/logger";
import { indexEntry, RecordIndexEntry } from "./indexEntry";
import { isKeyCustody, KeyCustody, StaticKeyCustody } from "./keys";
import {
  assembleRecordingFile,
  beepRecordingFile,
  RECORDING_PART,
  REDACTED_RECORDING_PART
} from "./recording";
import { contentHash, decodeVcon, SigningKey, signVconWith } from "./sign";
import { FsWorkingStore, RecordStore } from "./storage";
import {
  RecordEntry,
  SealedVersion,
  SealingVersion,
  StoredPart,
  Vcon
} from "./types";
import { buildVcon, namingDialog, redactStrings } from "./vcon";

const logger = getLogger({ service: "callrecord", filePath: __filename });

/** Call-record open question O1: a record is sealed within 30 s of hangup. */
export const SEAL_DEADLINE_MS = 30_000;

/** Parts a retention policy or a deletion request can name (call-record "Retention"). */
export const RECORD_PARTS = ["recording", "transcript", "messages"] as const;
export type RecordPart = (typeof RECORD_PARTS)[number];

/** A maintenance request named another workspace than the stored record's (RV-B6). */
export class WorkspaceMismatchError extends Error {
  constructor(callRef: string) {
    super(`record ${callRef} belongs to another workspace`);
    this.name = "WorkspaceMismatchError";
  }
}

/**
 * Refuses a change when the caller named a workspace that is not the stored record's. Callers
 * that do not name one (in-region jobs) are not checked; maintenance requests always name one.
 */
function assertSameWorkspace(
  callRef: string,
  stored: Vcon | undefined,
  expected: string | null | undefined
) {
  if (expected === undefined) return;
  const actual = stored ? workspaceOfVcon(stored) : null;
  if ((actual ?? null) !== (expected ?? null))
    throw new WorkspaceMismatchError(callRef);
}

/** One audited deletion (call-record "every deletion ... produces an audit entry"). */
export type AuditEntry = {
  callRef: string;
  workspaceRef: string | null;
  action: "delete_part" | "erase";
  part: RecordPart | "all";
  reason: string;
  actor: string;
  at: string;
  /** The version that records the deletion. */
  version: number;
};

export type CallRecordWriterOptions = {
  working: FsWorkingStore;
  /** The region's record store. */
  store: RecordStore;
  /**
   * A workspace's own bucket, if it configured one (design V2). When it fails at seal the record
   * stays in the region store and the index says so (open question O7, interim).
   */
  workspaceStore?: (workspaceRef: string) => RecordStore | undefined;
  /** A fixed key, or a custody that names the current key and signs (task 2.6). */
  key: SigningKey | KeyCustody;
  region: string;
  /** Called after each sealed version: index it, send `call_record.sealed`. */
  onSealed?: (entry: RecordIndexEntry) => void;
  /**
   * How often this writer marks its live calls' working records as alive (ST-5), so a writer
   * sweeping the same directory leaves them alone. Well under the sweep's deadline.
   */
  heartbeatMs?: number;
};

/** How long a sealer waits for another writer's seal of the same call. */
const OTHER_SEAL_WAIT_MS = 120_000;

/**
 * Builds call records live and seals them at hangup (call-record "The record is built during the
 * call and sealed at hangup"). It implements AppBridge's CallRecordSink interface.
 */
export class CallRecordWriter {
  /** Calls appended in this process and not closed yet; the sweep leaves them alone. */
  private readonly active = new Set<string>();
  private readonly sealing = new Map<string, Promise<SealingVersion>>();

  private readonly custody: KeyCustody;
  /** Names this writer in seal locks on a shared working directory. */
  private readonly owner = randomUUID();
  private heartbeat?: ReturnType<typeof setInterval>;

  constructor(private readonly options: CallRecordWriterOptions) {
    this.custody = isKeyCustody(options.key)
      ? options.key
      : new StaticKeyCustody(options.key);
  }

  get region() {
    return this.options.region;
  }

  append(callRef: string, entry: RecordEntry) {
    this.active.add(callRef);
    this.options.working.append(callRef, entry);
    this.heartbeat ??= setInterval(
      () => this.beat(),
      this.options.heartbeatMs ?? 5_000
    );
    this.heartbeat.unref?.();
  }

  /** Marks every live call of this writer as alive (see `heartbeatMs`). */
  beat() {
    for (const callRef of this.active) this.options.working.touch(callRef);
    if (!this.active.size && this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = undefined;
    }
  }

  /** Stops the heartbeat (shutdown; a writer that dies stops it too). */
  stop() {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = undefined;
  }

  /** Where the recorder writes this call's tracks (removed once the record is sealed). */
  recordingDir(callRef: string) {
    return this.options.working.recordingDir(callRef);
  }

  /** The call ended: seal its record in the background. */
  close(callRef: string) {
    this.active.delete(callRef);
    void this.seal(callRef).catch((e) =>
      logger.error(`could not seal ${callRef}: ${(e as Error).message}`)
    );
  }

  /** Resolves once every seal in progress has finished (tests, shutdown). */
  async flush() {
    await Promise.allSettled([...this.sealing.values()]);
  }

  /** The store a workspace's records go to. */
  storeFor(workspaceRef?: string | null): RecordStore {
    return (
      (workspaceRef && this.options.workspaceStore?.(workspaceRef)) ||
      this.options.store
    );
  }

  /**
   * The store that holds an existing record. With its indexed location (RV-B10) that is the
   * store at that location: a record whose workspace bucket failed at seal stays in the region
   * store, and a workspace that configured a bucket later keeps its older records where they
   * are. Without a location, the workspace's current store.
   */
  storeAt(location: string | undefined, workspaceRef?: string | null) {
    if (!location) return this.storeFor(workspaceRef);
    const candidates = [
      workspaceRef ? this.options.workspaceStore?.(workspaceRef) : undefined,
      this.options.store
    ];
    const found = candidates.find((s) => s && s.location === location);
    if (!found) throw new Error(`no record store at ${location}`);
    return found;
  }

  /** Seals a working record as version 1 and returns it; idempotent while in progress. */
  seal(callRef: string): Promise<SealingVersion> {
    const inProgress = this.sealing.get(callRef);
    if (inProgress) return inProgress;
    const p = this.doSeal(callRef).finally(() => this.sealing.delete(callRef));
    this.sealing.set(callRef, p);
    return p;
  }

  /** The sealed version 1 another writer stored, once its seal lock is gone. */
  private async sealedByOther(callRef: string): Promise<SealingVersion> {
    const { working } = this.options;
    const end = Date.now() + OTHER_SEAL_WAIT_MS;
    while (working.isSealLocked(callRef) && Date.now() < end)
      await new Promise((r) => setTimeout(r, 200));
    const entries = working.readWorking(callRef);
    const existing = await this.storeFor(workspaceOf(entries)).getVersion(
      callRef
    );
    if (!existing?.signed || !existing.redacted)
      throw new Error(`${callRef} is being sealed by another writer`);
    return {
      version: existing.version,
      signed: existing.signed,
      redacted: existing.redacted,
      parts: existing.manifest.parts.map((p): StoredPart => ({
        ...p,
        stored: true
      }))
    };
  }

  /**
   * Seals under a lock in the working directory, so of all the writers that share it exactly one
   * seals a call (its hangup on the owner, or a sweep elsewhere), once (ST-5).
   */
  private async doSeal(callRef: string): Promise<SealingVersion> {
    const { working } = this.options;
    if (!working.lockSeal(callRef, this.owner))
      return this.sealedByOther(callRef);
    try {
      return await this.sealLocked(callRef);
    } finally {
      working.unlockSeal(callRef, this.owner);
    }
  }

  private async sealLocked(callRef: string): Promise<SealingVersion> {
    const { working, region } = this.options;
    const entries = working.readWorking(callRef);
    const workspaceRef = workspaceOf(entries);
    let store = this.storeFor(workspaceRef);
    const existing = await store.getVersion(callRef);
    if (existing?.signed && existing.redacted) {
      working.discardWorking(callRef);
      return {
        version: existing.version,
        signed: existing.signed,
        redacted: existing.redacted,
        parts: existing.manifest.parts.map((p): StoredPart => ({
          ...p,
          stored: true
        }))
      };
    }
    // Streamed to a file next to the tracks and uploaded from there (LO-B7); the working
    // directory, file included, is discarded once the record is stored.
    const recDir = working.recordingDir(callRef);
    const rec = assembleRecordingFile(
      recDir,
      path.join(recDir, RECORDING_PART)
    );
    const built = buildVcon(callRef, entries, {
      region,
      recording: rec
        ? {
            part: {
              name: RECORDING_PART,
              mimetype: "audio/x-wav",
              file: rec.file,
              size: rec.size,
              content_hash: rec.content_hash
            },
            startedAt: rec.startedAt,
            durationMs: rec.durationMs,
            beep: (spans) => ({
              name: REDACTED_RECORDING_PART,
              mimetype: "audio/x-wav",
              ...beepRecordingFile(
                rec.file,
                path.join(recDir, REDACTED_RECORDING_PART),
                spans
              )
            })
          }
        : undefined
    });
    const sealed: SealingVersion = {
      version: 1,
      signed: await signVconWith(built.vcon, this.custody),
      redacted: await signVconWith(built.redacted, this.custody),
      parts: built.parts
    };
    try {
      await store.putSealed(callRef, sealed);
    } catch (e) {
      if (store === this.options.store) throw e;
      logger.warn(
        `workspace bucket failed for ${callRef}, keeping it in the region store: ${(e as Error).message}`
      );
      store = this.options.store;
      await store.putSealed(callRef, sealed);
    }
    working.discardWorking(callRef);
    this.sealed(callRef, sealed, built.vcon, store);
    return sealed;
  }

  private sealed(
    callRef: string,
    sealed: SealedVersion | SealingVersion,
    vcon: Vcon,
    store: RecordStore
  ) {
    try {
      this.options.onSealed?.(
        indexEntry(callRef, sealed, vcon, {
          region: this.options.region,
          location: store.location
        })
      );
    } catch (e) {
      logger.error(`onSealed failed for ${callRef}: ${(e as Error).message}`);
    }
  }

  /**
   * Seals records whose calls stopped appending more than `deadlineMs` ago without a hangup (a
   * appbridge that crashed). Returns the callRefs sealed.
   */
  async sweep(now = Date.now(), deadlineMs = SEAL_DEADLINE_MS) {
    const sealed: string[] = [];
    // Live calls of this writer first, so other writers see them alive.
    this.beat();
    for (const w of this.options.working.listWorking()) {
      if (this.active.has(w.callRef) || this.sealing.has(w.callRef)) continue;
      // Quiet for the deadline: neither appended to nor kept alive by its owner's heartbeat.
      if (now - w.lastAppendAt < deadlineMs) continue;
      // Another writer is sealing it right now.
      if (this.options.working.isSealLocked(w.callRef)) continue;
      try {
        await this.seal(w.callRef);
        sealed.push(w.callRef);
      } catch (e) {
        logger.error(`could not seal ${w.callRef}: ${(e as Error).message}`);
      }
    }
    return sealed;
  }

  /** Adds a version derived from the current one (it references its predecessor). */
  private async newVersion(
    callRef: string,
    workspaceRef: string | null | undefined,
    change: (vcon: Vcon, redacted: boolean) => Vcon,
    checkWorkspace = false,
    location?: string
  ): Promise<{ sealed: SealingVersion; previous: { version: number } }> {
    const store = this.storeAt(location, workspaceRef);
    // Without part contents: a new version shares the stored parts (no recording download).
    const stored = await store.getVersion(callRef);
    if (!stored?.signed || !stored.redacted)
      throw new Error(`no sealed record for ${callRef}`);
    const current = {
      version: stored.version,
      signed: stored.signed,
      redacted: stored.redacted,
      parts: stored.manifest.parts.map((p): StoredPart => ({
        ...p,
        stored: true
      }))
    };
    if (checkWorkspace)
      assertSameWorkspace(callRef, decodeVcon(current.signed), workspaceRef);
    const next = (signed: SealedVersion["signed"], redacted: boolean): Vcon => {
      const prev = decodeVcon(signed);
      return {
        ...change(prev, redacted),
        uuid: randomUUID(),
        updated_at: new Date().toISOString(),
        amended: {
          uuid: prev.uuid,
          content_hash: contentHash(Buffer.from(JSON.stringify(prev)))
        }
      };
    };
    const vcon = next(current.signed, false);
    // draft-04 4.1: `redacted` and `amended` are mutually exclusive. The original carries the
    // version chain (amended → its predecessor); the redacted copy points at this version's
    // original only (LO-B8).
    const { amended: _amended, ...redactedNext } = next(current.redacted, true);
    void _amended;
    const redactedVcon: Vcon = {
      ...redactedNext,
      redacted: {
        ...((decodeVcon(current.redacted).redacted as object) ?? {}),
        uuid: vcon.uuid,
        content_hash: contentHash(Buffer.from(JSON.stringify(vcon)))
      }
    };
    const sealed: SealingVersion = {
      version: current.version + 1,
      signed: await signVconWith(vcon, this.custody),
      redacted: await signVconWith(redactedVcon, this.custody),
      parts: current.parts
    };
    await store.putSealed(callRef, sealed);
    this.sealed(callRef, sealed, vcon, store);
    return { sealed, previous: current };
  }

  /**
   * Adds to a sealed record as a new version that references its predecessor (call-record
   * "Additions after sealing create new versions"); the previous version is unchanged.
   */
  async addVersion(
    callRef: string,
    additions: { analysis?: Record<string, unknown>[] },
    workspaceRef?: string,
    location?: string
  ): Promise<SealingVersion> {
    const { sealed } = await this.newVersion(
      callRef,
      workspaceRef,
      (v, redacted) => ({
        ...v,
        analysis: [
          ...v.analysis,
          // The redacted copy gets the additions redacted too (like the sealed analysis, R-B4).
          // draft-04 2.3.2: an inline body needs its encoding. Without a dialog, an addition is
          // derived from all of this copy's.
          ...(additions.analysis ?? [])
            .map((a) =>
              a.encoding
                ? a
                : {
                    ...a,
                    encoding: typeof a.body === "string" ? "none" : "json"
                  }
            )
            .map((a) =>
              redacted ? (redactStrings(a) as Record<string, unknown>) : a
            )
            .map((a) => namingDialog(a, v.dialog))
        ]
      }),
      false,
      location
    );
    return sealed;
  }

  /**
   * Deletes parts of a record (retention policy or a request) and writes a version that records
   * each removal (call-record "Retention follows workspace policy and deletions are audited").
   * The recording and the messages are files; the transcript lives inside the vCons, so earlier
   * versions' contents are deleted too and only their manifests remain.
   */
  async deleteParts(
    callRef: string,
    requested: RecordPart[],
    by: {
      reason: string;
      actor: string;
      workspaceRef?: string | null;
      location?: string;
    }
  ): Promise<{ sealed: SealingVersion; audit: AuditEntry[] }> {
    // messages.ndjson holds every session message, the caller's and the agent's words included:
    // deleting the transcript deletes it too (RV-B11), and the audit says so.
    const parts: RecordPart[] =
      requested.includes("transcript") && !requested.includes("messages")
        ? [...requested, "messages"]
        : requested;
    const store = this.storeAt(by.location, by.workspaceRef);
    const at = new Date().toISOString();
    const deletion = (part: RecordPart) => ({
      part,
      at,
      reason: by.reason,
      actor: by.actor
    });
    // The recording is two files when the redacted copy has a beeped one (LO-B9).
    const fileOf: Partial<Record<RecordPart, string[]>> = {
      recording: [RECORDING_PART, REDACTED_RECORDING_PART],
      messages: ["messages.ndjson"]
    };
    const { sealed, previous } = await this.newVersion(
      callRef,
      by.workspaceRef,
      (v) => {
        const removedFile = (entry: Record<string, unknown>) => {
          const name = String(entry.url ?? "").replace(/^parts\//, "");
          const part = parts.find((p) => fileOf[p]?.includes(name));
          if (!part) return entry;
          const { url: _url, ...rest } = entry;
          void _url;
          return {
            ...rest,
            meta: { ...(rest.meta as object), deleted: deletion(part) }
          };
        };
        let dialog = v.dialog.map(removedFile);
        let analysis = v.analysis;
        if (parts.includes("transcript")) {
          // The text turns go: each analysis keeps naming the entries that remain.
          const kept = dialog.flatMap((d, i) => (d.type === "text" ? [] : [i]));
          dialog = kept.map((i) => dialog[i]);
          analysis = analysis.map((a) => {
            const named = Array.isArray(a.dialog)
              ? {
                  ...a,
                  dialog: (a.dialog as number[])
                    .map((i) => kept.indexOf(i))
                    .filter((i) => i >= 0)
                }
              : a;
            return a.type === "turn_decisions"
              ? {
                  ...named,
                  body: [],
                  meta: { deleted: deletion("transcript") }
                }
              : named;
          });
        }
        const f = (v.fonoster ?? {}) as Record<string, unknown>;
        return {
          ...v,
          dialog,
          analysis,
          // vcon-lib needs an attachment's url or inline body: a deleted file's attachment goes,
          // and fonoster.deletions records it.
          attachments: v.attachments.filter((a) => removedFile(a) === a),
          fonoster: {
            ...f,
            deletions: [
              ...((f.deletions as unknown[]) ?? []),
              ...parts.map(deletion)
            ]
          }
        };
      },
      true,
      by.location
    );
    for (const part of parts)
      for (const file of fileOf[part] ?? [])
        await store.deletePart(callRef, file);
    if (parts.includes("transcript"))
      for (let v = 1; v <= previous.version; v++)
        await store.deleteVersionContents(callRef, v);
    const workspaceRef =
      by.workspaceRef ?? workspaceOfVcon(decodeVcon(sealed.signed));
    return {
      sealed: {
        ...sealed,
        parts: sealed.parts.filter(
          (p) => !parts.some((part) => fileOf[part]?.includes(p.name))
        )
      },
      audit: parts.map((part) => ({
        callRef,
        workspaceRef,
        action: "delete_part" as const,
        part,
        reason: by.reason,
        actor: by.actor,
        at,
        version: sealed.version
      }))
    };
  }

  /**
   * Erases one call (call-record "Erasing one call"): every file and version is deleted, and a
   * signed tombstone version states when, why and by whom. It holds no call content.
   */
  async erase(
    callRef: string,
    by: {
      reason: string;
      actor: string;
      workspaceRef?: string | null;
      location?: string;
    }
  ): Promise<{ audit: AuditEntry[]; version: number }> {
    const store = this.storeAt(by.location, by.workspaceRef);
    const current = await store.getVersion(callRef);
    if (!current) throw new Error(`no sealed record for ${callRef}`);
    const at = new Date().toISOString();
    const previous = current.signed ? decodeVcon(current.signed) : undefined;
    assertSameWorkspace(callRef, previous, by.workspaceRef);
    const workspaceRef =
      by.workspaceRef ?? (previous ? workspaceOfVcon(previous) : null);
    await store.deleteAll(callRef);
    const tombstone: Vcon = {
      vcon: previous?.vcon ?? "0.4.0",
      uuid: randomUUID(),
      created_at: at,
      updated_at: at,
      parties: [],
      dialog: [],
      analysis: [],
      attachments: [],
      fonoster: {
        callRef,
        region: this.options.region,
        status: "erased",
        workspaceRef,
        erased: { at, reason: by.reason, actor: by.actor }
      }
    };
    const version = current.version + 1;
    const signed = await signVconWith(tombstone, this.custody);
    const sealed: SealedVersion = {
      version,
      signed,
      redacted: signed,
      parts: []
    };
    await store.putSealed(callRef, sealed);
    this.sealed(callRef, sealed, tombstone, store);
    return {
      version,
      audit: [
        {
          callRef,
          workspaceRef,
          action: "erase",
          part: "all",
          reason: by.reason,
          actor: by.actor,
          at,
          version
        }
      ]
    };
  }
}

function workspaceOf(entries: RecordEntry[]): string | null {
  for (const e of entries) {
    const w = e.message.workspaceRef;
    if (typeof w === "string" && w) return w;
  }
  return null;
}

function workspaceOfVcon(vcon: Vcon): string | null {
  return (
    ((vcon.fonoster ?? {}) as { workspaceRef?: string }).workspaceRef ?? null
  );
}
