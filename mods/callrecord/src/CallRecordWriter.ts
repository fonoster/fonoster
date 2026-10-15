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
import { getLogger } from "@fonoster/logger";
import { contentHash, decodeVcon, SigningKey, signVcon } from "./sign";
import { RecordStorage } from "./storage";
import { RecordEntry, SealedVersion, Vcon } from "./types";
import { buildVcon } from "./vcon";

const logger = getLogger({ service: "callrecord", filePath: __filename });

/** Call-record open question O1: a record is sealed within 30 s of hangup. */
export const SEAL_DEADLINE_MS = 30_000;

export type CallRecordWriterOptions = {
  storage: RecordStorage;
  key: SigningKey;
  region: string;
  /** Called after each sealed version (for call_record.sealed webhooks). */
  onSealed?: (callRef: string, version: number) => void;
};

/**
 * Builds call records live and seals them at hangup (call-record "The record is built during the
 * call and sealed at hangup"). It implements the gateway's CallRecordSink interface.
 */
export class CallRecordWriter {
  constructor(private readonly options: CallRecordWriterOptions) {}

  append(callRef: string, entry: RecordEntry) {
    this.options.storage.append(callRef, entry);
  }

  /** The call ended: seal its record. */
  close(callRef: string) {
    try {
      this.seal(callRef);
    } catch (e) {
      logger.error(`could not seal ${callRef}: ${(e as Error).message}`);
    }
  }

  /** Seals a working record as version 1 and returns it. */
  seal(callRef: string): SealedVersion {
    const { storage, key, region } = this.options;
    const existing = storage.getSealed(callRef);
    if (existing) {
      storage.discardWorking(callRef);
      return existing;
    }
    const built = buildVcon(callRef, storage.readWorking(callRef), { region });
    const sealed: SealedVersion = {
      version: 1,
      signed: signVcon(built.vcon, key),
      redacted: signVcon(built.redacted, key),
      parts: built.parts
    };
    storage.putSealed(callRef, sealed);
    storage.discardWorking(callRef);
    this.options.onSealed?.(callRef, 1);
    return sealed;
  }

  /**
   * Seals records whose calls stopped appending more than `deadlineMs` ago without a hangup (a
   * gateway that crashed). Returns the callRefs sealed.
   */
  sweep(now = Date.now(), deadlineMs = SEAL_DEADLINE_MS): string[] {
    const sealed: string[] = [];
    for (const w of this.options.storage.listWorking()) {
      if (now - w.lastAppendAt < deadlineMs) continue;
      this.close(w.callRef);
      sealed.push(w.callRef);
    }
    return sealed;
  }

  /**
   * Adds to a sealed record as a new version that references its predecessor (call-record
   * "Additions after sealing create new versions"); the previous version is unchanged.
   */
  addVersion(
    callRef: string,
    additions: { analysis?: Record<string, unknown>[] }
  ): SealedVersion {
    const { storage, key } = this.options;
    const current = storage.getSealed(callRef);
    if (!current) throw new Error(`no sealed record for ${callRef}`);
    const previous = decodeVcon(current.signed);
    const previousRedacted = decodeVcon(current.redacted);
    const next = (base: Vcon, prev: Vcon): Vcon => ({
      ...base,
      uuid: randomUUID(),
      updated_at: new Date().toISOString(),
      analysis: [...base.analysis, ...(additions.analysis ?? [])],
      amended: {
        uuid: prev.uuid,
        content_hash: contentHash(Buffer.from(JSON.stringify(prev)))
      }
    });
    const sealed: SealedVersion = {
      version: current.version + 1,
      signed: signVcon(next(previous, previous), key),
      redacted: signVcon(next(previousRedacted, previousRedacted), key),
      parts: current.parts
    };
    storage.putSealed(callRef, sealed);
    this.options.onSealed?.(callRef, sealed.version);
    return sealed;
  }
}
