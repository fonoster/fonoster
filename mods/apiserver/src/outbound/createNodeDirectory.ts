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
/** One media node as its heartbeats describe it (media-control, node.heartbeat). */
export type MediaNodeStatus = {
  nodeId: string;
  rooms: number;
  /** The node's room limit (media-node "Call and room limits"); unset for nodes that report none. */
  maxRooms?: number;
  draining: boolean;
  seenAt: number;
};

/** Heartbeats are every 2 s; a node silent for three of them is not offered new calls. */
export const NODE_STALE_MS = 6000;

/**
 * The media nodes this replica knows, for placing outbound calls (add-media-node 3.3): fed by the
 * session registry's `nodes.` entries (JetStream KV, 3.2; read in full at start, so a restarted
 * replica places calls at once) and by `node.heartbeat` / `node.down` events.
 */
export function createNodeDirectory(
  options: { staleMs?: number; now?: () => number } = {}
) {
  const staleMs = options.staleMs ?? NODE_STALE_MS;
  const now = options.now ?? Date.now;
  const nodes = new Map<string, MediaNodeStatus>();

  return {
    /**
     * Feeds one `node.heartbeat` or `node.down` event; `seenAt` (ms) is when it was written, for
     * registry entries read after the fact (default now).
     */
    note(event: Record<string, unknown>, seenAt?: number) {
      const nodeId = typeof event.nodeId === "string" ? event.nodeId : "";
      if (!nodeId) return;
      if (event.type === "node.down") {
        nodes.delete(nodeId);
      } else if (event.type === "node.heartbeat") {
        const at = seenAt ?? now();
        const known = nodes.get(nodeId);
        // An older registry entry never replaces a fresher heartbeat.
        if (known && known.seenAt > at) return;
        const maxRooms = Number(event.maxRooms);
        nodes.set(nodeId, {
          nodeId,
          rooms: Number(event.rooms ?? 0),
          maxRooms:
            Number.isFinite(maxRooms) && maxRooms > 0 ? maxRooms : undefined,
          draining: event.draining === true,
          seenAt: at
        });
      }
    },
    /**
     * The least-loaded eligible node (live, not draining, below its room limit), skipping the
     * nodes in `exclude` (already tried for this call); undefined when there is none.
     */
    pick(exclude: ReadonlySet<string> = new Set()): string | undefined {
      let best: MediaNodeStatus | undefined;
      for (const n of nodes.values()) {
        if (exclude.has(n.nodeId) || n.draining) continue;
        if (now() - n.seenAt > staleMs) continue;
        if (n.maxRooms !== undefined && n.rooms >= n.maxRooms) continue;
        if (!best || n.rooms < best.rooms) best = n;
      }
      return best?.nodeId;
    },
    /**
     * A node refused a room because it is full or draining: no new call goes to it until its
     * next heartbeat says otherwise.
     */
    refused(nodeId: string, code: string) {
      const n = nodes.get(nodeId);
      if (!n) return;
      if (code === "draining") n.draining = true;
      else n.maxRooms = Math.min(n.maxRooms ?? n.rooms, n.rooms);
    },
    /** Counts a room placed on a node before its next heartbeat reports it. */
    placed(nodeId: string) {
      const n = nodes.get(nodeId);
      if (n) n.rooms += 1;
    },
    list(): MediaNodeStatus[] {
      return [...nodes.values()];
    }
  };
}

export type NodeDirectory = ReturnType<typeof createNodeDirectory>;
