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
import { createPerCallCache } from "./createPerCallCache";
import type { KV, NatsConnection } from "nats";

/**
 * Routr call id → call ref, shared by every apiserver replica. A call's events (Routr's
 * `routr.call.*`) are handled by whichever replica of the queue group gets them, and not every
 * event carries the ref (an API call's `call.ended` has no X-Call-Ref), so the mapping cannot live
 * in one replica's memory: another replica, or the same one after a restart, would write the
 * call's later points without the ref and split its record (ST-1).
 */
export type CallRefStore = {
  get(callId: string): Promise<string | undefined>;
  set(callId: string, ref: string): Promise<void>;
};

export const CALL_REFS_BUCKET = "fonoster_call_refs";
export const CALL_REFS_TTL_MS = 24 * 60 * 60 * 1000;

const key = (callId: string) => callId.replace(/[^-_=/.a-zA-Z0-9]/g, "_");

/** This process only (tests, or when the NATS user may not open the bucket). */
export function memoryCallRefs(ttlMs = CALL_REFS_TTL_MS): CallRefStore {
  const cache = createPerCallCache<string>(ttlMs);
  return {
    async get(callId) {
      return cache.get(callId);
    },
    async set(callId, ref) {
      cache.set(callId, ref);
    }
  };
}

/** The mapping in a JetStream KV bucket; entries expire after a day. */
export function kvCallRefs(kv: KV): CallRefStore {
  return {
    async get(callId) {
      const e = await kv.get(key(callId));
      return e && e.operation === "PUT" && e.value.length
        ? e.string()
        : undefined;
    },
    async set(callId, ref) {
      await kv.put(key(callId), ref);
    }
  };
}

/**
 * Opens (or creates) the shared bucket. Falls back to this process's memory, with a warning, when
 * JetStream is off or the NATS user may not use the bucket: CDRs then split when another replica
 * handles a call's later events (the behavior before ST-1).
 */
export async function openCallRefs(
  nc: NatsConnection,
  logger: { warn(m: string): void },
  options: { bucket?: string; ttlMs?: number } = {}
): Promise<CallRefStore> {
  const bucket = options.bucket ?? CALL_REFS_BUCKET;
  const views = nc.jetstream().views;
  try {
    let kv: KV;
    try {
      kv = await views.kv(bucket, {
        history: 1,
        ttl: options.ttlMs ?? CALL_REFS_TTL_MS,
        description: "Fonoster: Routr call id -> call ref, for CDRs"
      });
    } catch (e) {
      if (!/already in use/i.test((e as Error).message)) throw e;
      kv = await views.kv(bucket, { bindOnly: true });
    }
    return kvCallRefs(kv);
  } catch (e) {
    logger.warn(
      `call refs: cannot open KV bucket ${bucket} (${(e as Error).message}); keeping them in memory, so CDRs of one call may split across replicas`
    );
    return memoryCallRefs(options.ttlMs);
  }
}
