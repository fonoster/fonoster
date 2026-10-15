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
import { NatsConnection, StringCodec, Subscription } from "nats";
import { subjects } from "./types";

const sc = StringCodec();

export type RelayRequest = {
  userRef: string;
  op: "record.get" | "record.part";
  callRef: string;
  part?: string;
  range?: string;
  /** record.get: the unredacted original (the control plane checked the role). */
  original?: boolean;
  version?: number;
};

type Chunk = {
  type: "region.relay.chunk" | "region.relay.error";
  id: string;
  seq: number;
  last?: boolean;
  contentType?: string;
  data?: string;
  code?: string;
  message?: string;
};

/** A relay that could not complete: `region_offline` (no answer), or the cell's error code. */
export class RelayError extends Error {
  constructor(
    readonly code: string,
    message?: string
  ) {
    super(message ?? code);
  }
}

export const RELAY_CHUNK_MAX = 512 * 1024;

/**
 * Fetches call content from a private cell over the link (PR-5, task 2.5). The reply inbox is under
 * `region.R._INBOX` so it stays inside the region's subjects (RG-B4). Chunks are yielded in `seq`
 * order as they arrive; nothing is buffered beyond out-of-order chunks or written anywhere.
 */
export function createRelayClient(
  nc: NatsConnection,
  options: {
    firstChunkTimeoutMs?: number;
    idleTimeoutMs?: number;
    maxBytes?: number;
    /** Relays in flight per region; more answer `rate_limited` (HTTP 429). */
    maxConcurrent?: number;
  } = {}
) {
  const inFlight = new Map<string, number>();
  const maxConcurrent = options.maxConcurrent ?? 8;
  const firstTimeout = options.firstChunkTimeoutMs ?? 5000;
  const idleTimeout = options.idleTimeoutMs ?? 10000;
  const maxBytes = options.maxBytes ?? 256 * 1024 * 1024;

  return {
    /** Opens a relay; resolves once the first chunk is in (so the HTTP status is known). */
    async open(regionRef: string, request: RelayRequest) {
      const busy = inFlight.get(regionRef) ?? 0;
      if (busy >= maxConcurrent)
        throw new RelayError(
          "rate_limited",
          "too many downloads from this region at once"
        );
      inFlight.set(regionRef, busy + 1);
      const id = randomUUID();
      const inbox = `${subjects(regionRef).inbox}.${id}`;
      const sub: Subscription = nc.subscribe(inbox);
      const pending = new Map<number, Chunk>();
      let next = 0;
      let done = false;
      let waiter: ((c: Chunk | Error) => void) | undefined;
      const queue: (Chunk | Error)[] = [];
      const deliver = (c: Chunk | Error) => {
        if (waiter) {
          const w = waiter;
          waiter = undefined;
          w(c);
        } else queue.push(c);
      };
      void (async () => {
        for await (const m of sub) {
          let c: Chunk;
          try {
            c = JSON.parse(sc.decode(m.data));
          } catch {
            continue;
          }
          if (c.id !== id) continue;
          if (c.type === "region.relay.error") {
            deliver(new RelayError(c.code ?? "relay_failed", c.message));
            continue;
          }
          pending.set(Number(c.seq ?? 0), c);
          while (pending.has(next)) {
            deliver(pending.get(next)!);
            pending.delete(next);
            next++;
          }
        }
      })();
      const take = (timeoutMs: number) =>
        new Promise<Chunk>((resolve, reject) => {
          const settle = (c: Chunk | Error) => {
            clearTimeout(timer);
            if (c instanceof Error) reject(c);
            else resolve(c);
          };
          const timer = setTimeout(() => {
            waiter = undefined;
            reject(
              new RelayError(
                "region_offline",
                "the private region did not answer; it may be offline"
              )
            );
          }, timeoutMs);
          const queued = queue.shift();
          if (queued) settle(queued);
          else waiter = settle;
        });
      let released = false;
      const close = () => {
        done = true;
        sub.unsubscribe();
        if (released) return;
        released = true;
        const n = (inFlight.get(regionRef) ?? 1) - 1;
        if (n > 0) inFlight.set(regionRef, n);
        else inFlight.delete(regionRef);
      };

      nc.publish(
        subjects(regionRef).relay,
        sc.encode(JSON.stringify({ type: "region.relay", id, ...request })),
        { reply: inbox }
      );

      let first: Chunk;
      try {
        first = await take(firstTimeout);
      } catch (e) {
        close();
        throw e;
      }

      async function* chunks(): AsyncGenerator<Buffer> {
        let c: Chunk | undefined = first;
        let total = 0;
        try {
          while (c) {
            const data = Buffer.from(c.data ?? "", "base64");
            total += data.length;
            if (total > maxBytes)
              throw new RelayError(
                "too_large",
                "relayed content exceeds the limit"
              );
            if (data.length) yield data;
            if (c.last || done) return;
            c = await take(idleTimeout);
          }
        } finally {
          close();
        }
      }

      return {
        contentType: first.contentType ?? "application/octet-stream",
        chunks: chunks(),
        close
      };
    }
  };
}

export type RelayClient = ReturnType<typeof createRelayClient>;
