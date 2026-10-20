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
import type { KV, KvEntry, NatsConnection } from "nats";

/**
 * The session registry (add-platform 2.3, add-roomr 3.2, decision D3): one NATS JetStream KV
 * bucket shared by every service. Keys are `<kind>.<id>`:
 *
 *   calls.<callRef>       appbridge:    { callRef, bridgeRef, nodeId, roomRef, direction, at }
 *                                     + once answered: { appRef, from, to, startedAt }
 *   appbridges.<bridgeRef> appbridge:    { bridgeRef, calls, at }
 *   placements.<callRef>  apiserver:  { callRef, nodeRef, controlAddr, roomRef?, at }
 *                                     while an outbound call is being placed (CreateCall)
 *
 * Roomr nodes write nothing here (core NATS only: heartbeat and events); the control plane learns
 * nodes from their heartbeats.
 *
 * The control plane reads `calls` and `appbridges`: a call whose entry and whose AppBridge's entry
 * both stop being rewritten lost its AppBridge mid-call, and gets `call.ended` (`appbridge-lost`).
 *
 * Entries are leases: the bucket keeps a value for SESSIONS_TTL_MS after its last write, owners
 * rewrite theirs every SESSIONS_REFRESH_MS, and a crashed owner's entries expire on their own.
 */
export const SESSIONS_BUCKET = "fonoster_sessions";
export const SESSIONS_TTL_MS = 15_000;
export const SESSIONS_REFRESH_MS = 5_000;

export type SessionKind =
  "nodes" | "rooms" | "calls" | "appbridges" | "placements";

/** `<kind>.<id>` with characters KV keys do not allow replaced by `_`. */
export const sessionKey = (kind: SessionKind, id: string) =>
  `${kind}.${id.replace(/[^-_=/.a-zA-Z0-9]/g, "_")}`;

/** Opens the bucket, creating it when it does not exist yet. */
export async function openSessions(
  nc: NatsConnection,
  options: { bucket?: string; ttlMs?: number } = {}
): Promise<KV> {
  const bucket = options.bucket ?? SESSIONS_BUCKET;
  const open = () =>
    nc.jetstream().views.kv(bucket, {
      history: 1,
      ttl: options.ttlMs ?? SESSIONS_TTL_MS,
      description:
        "Fonoster session registry: nodes, rooms, calls, appbridges (leases)"
    });
  try {
    return await open();
  } catch (e) {
    // Another service created it at the same moment with a slightly different config: bind.
    if (/already in use/i.test((e as Error).message))
      return nc.jetstream().views.kv(bucket, { bindOnly: true });
    throw e;
  }
}

type Logger = { warn(message: string): void };

/**
 * An owner's entries, kept alive until deleted (AppBridge's calls and its own appbridge entry).
 * Writes never throw: the registry is best effort and entries are rewritten on the next refresh.
 */
export class SessionLeases {
  private readonly entries = new Map<string, Record<string, unknown>>();
  private readonly timer: ReturnType<typeof setInterval>;
  private chain: Promise<unknown> = Promise.resolve();
  private closed = false;

  constructor(
    private readonly kv: KV,
    private readonly options: { refreshMs?: number; logger?: Logger } = {}
  ) {
    this.timer = setInterval(
      () => this.refresh(),
      options.refreshMs ?? SESSIONS_REFRESH_MS
    );
    this.timer.unref?.();
  }

  private write(key: string, value?: Record<string, unknown>) {
    // One write at a time, in order (a delete never overtakes the put before it).
    this.chain = this.chain.then(async () => {
      try {
        if (value)
          await this.kv.put(
            key,
            JSON.stringify({ ...value, at: new Date().toISOString() })
          );
        else await this.kv.delete(key);
      } catch (e) {
        this.options.logger?.warn(
          `session registry write ${key} failed: ${(e as Error).message}`
        );
      }
    });
    return this.chain;
  }

  /** Writes the entry now and keeps it alive. */
  set(kind: SessionKind, id: string, value: Record<string, unknown>) {
    if (this.closed) return Promise.resolve();
    const key = sessionKey(kind, id);
    this.entries.set(key, value);
    return this.write(key, value);
  }

  /** Removes the entry. */
  delete(kind: SessionKind, id: string) {
    if (this.closed) return Promise.resolve();
    const key = sessionKey(kind, id);
    this.entries.delete(key);
    return this.write(key);
  }

  /** Reads any owner's entry from the bucket (undefined when absent or expired). */
  get(kind: SessionKind, id: string) {
    return getSession(this.kv, kind, id);
  }

  /** Rewrites every live entry (called on a timer). */
  refresh() {
    for (const [key, value] of this.entries) void this.write(key, value);
    return this.chain;
  }

  /** Stops refreshing; with `remove`, deletes every entry first (clean shutdown). */
  async close(remove = true) {
    if (this.closed) return;
    clearInterval(this.timer);
    if (remove) for (const key of this.entries.keys()) void this.write(key);
    this.closed = true;
    this.entries.clear();
    await this.chain;
  }
}

export type SessionEntry = {
  kind: SessionKind;
  id: string;
  /** Undefined when the entry was deleted or purged. */
  value?: Record<string, unknown>;
  /** When the entry was last written (the server's timestamp). */
  writtenAt: Date;
};

/**
 * Follows one kind of entries: the current ones first (so a restarted replica knows the registry
 * at once), then every change. Returns a stop function.
 */
export async function watchSessions(
  kv: KV,
  kind: SessionKind,
  onEntry: (entry: SessionEntry) => void
): Promise<() => void> {
  const iter = await kv.watch({ key: `${kind}.>` });
  void (async () => {
    for await (const e of iter as AsyncIterable<KvEntry>) {
      const id = e.key.slice(kind.length + 1);
      let value: Record<string, unknown> | undefined;
      if (e.operation === "PUT") {
        try {
          value = JSON.parse(e.string());
        } catch {
          continue;
        }
      }
      onEntry({ kind, id, value, writtenAt: e.created });
    }
  })();
  return () => iter.stop();
}

/** Reads one entry (undefined when absent or expired). */
export async function getSession(
  kv: KV,
  kind: SessionKind,
  id: string
): Promise<Record<string, unknown> | undefined> {
  const e = await kv.get(sessionKey(kind, id));
  if (!e || e.operation !== "PUT") return undefined;
  try {
    return JSON.parse(e.string());
  } catch {
    return undefined;
  }
}
