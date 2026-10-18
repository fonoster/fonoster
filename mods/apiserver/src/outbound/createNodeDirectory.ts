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
  /** The heartbeat's node_ref. */
  nodeId: string;
  rooms: number;
  /** The node's room limit (max_rooms); unset for nodes that report none. */
  maxRooms?: number;
  /** The node's region; unset for nodes that report none. */
  region?: string;
  draining: boolean;
  /** Where the node serves Roomr (the heartbeat's control_addr); unset: no calls placed on it. */
  controlAddr?: string;
  seenAt: number;
};

/** The room limit assumed for a node that reports none (the media node's default). */
export const DEFAULT_MAX_ROOMS = 200;

/** Heartbeats are every 2 s; a node silent for three of them is not offered new calls. */
export const NODE_STALE_MS = 6000;

/**
 * A node silent this long is forgotten. A crashed or replaced node sends no `node.down` and its
 * registry lease expires without a delete event, so silence is the only sign it is gone.
 */
export const NODE_FORGET_MS = 60_000;

/**
 * The media nodes this replica knows, for placing outbound calls (add-media-node 3.3): fed by the
 * session registry's `nodes.` entries (JetStream KV, 3.2; read in full at start, so a restarted
 * replica places calls at once) and by `node.heartbeat` / `node.down` events on
 * `roomr.nodes.<node_ref>.heartbeat`.
 */
export function createNodeDirectory(
  options: { staleMs?: number; forgetMs?: number; now?: () => number } = {}
) {
  const staleMs = options.staleMs ?? NODE_STALE_MS;
  const forgetMs = Math.max(options.forgetMs ?? NODE_FORGET_MS, staleMs);
  const now = options.now ?? Date.now;
  const nodes = new Map<string, MediaNodeStatus>();
  let sweptAt = now();
  /** Drops the nodes silent for `forgetMs` (at most once per `staleMs`). */
  const forget = () => {
    const t = now();
    if (t - sweptAt < staleMs) return;
    sweptAt = t;
    for (const [id, n] of nodes) if (t - n.seenAt > forgetMs) nodes.delete(id);
  };

  return {
    /**
     * Feeds one `node.heartbeat` or `node.down` event; `seenAt` (ms) is when it was written, for
     * registry entries read after the fact (default now).
     */
    note(event: Record<string, unknown>, seenAt?: number) {
      const nodeId = typeof event.node_ref === "string" ? event.node_ref : "";
      if (!nodeId) return;
      if (event.type === "node.down") {
        nodes.delete(nodeId);
      } else if (event.type === "node.heartbeat") {
        const at = seenAt ?? now();
        const known = nodes.get(nodeId);
        // An older registry entry never replaces a fresher heartbeat.
        if (known && known.seenAt > at) return;
        const maxRooms = Number(event.max_rooms);
        nodes.set(nodeId, {
          nodeId,
          rooms: Number(event.rooms ?? 0),
          maxRooms:
            Number.isFinite(maxRooms) && maxRooms > 0 ? maxRooms : undefined,
          region:
            typeof event.region === "string" && event.region
              ? event.region
              : undefined,
          draining: event.draining === true,
          controlAddr:
            typeof event.control_addr === "string" && event.control_addr
              ? event.control_addr
              : undefined,
          seenAt: at
        });
      }
      forget();
    },
    /**
     * The eligible node with the most room to spare (control-plane): live, not draining, below
     * its room limit, with a control address and, when the call names a region, in that region; scored
     * `1 - rooms / max_rooms`, highest wins. Skips the nodes in `exclude` (already tried for
     * this call); undefined when there is none.
     */
    pick(
      exclude: ReadonlySet<string> = new Set(),
      region?: string
    ): string | undefined {
      let best: { node: MediaNodeStatus; score: number } | undefined;
      for (const n of nodes.values()) {
        if (exclude.has(n.nodeId) || n.draining || !n.controlAddr) continue;
        if (now() - n.seenAt > staleMs) continue;
        if (region && n.region !== region) continue;
        const limit = n.maxRooms ?? DEFAULT_MAX_ROOMS;
        if (n.rooms >= limit) continue;
        const score = 1 - n.rooms / limit;
        if (!best || score > best.score) best = { node: n, score };
      }
      return best?.node.nodeId;
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
    /** The node's Roomr address (control_addr), if known. */
    addressOf(nodeId: string): string | undefined {
      return nodes.get(nodeId)?.controlAddr;
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
