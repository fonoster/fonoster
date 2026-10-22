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

// What a scenario may change in a node's configuration (redesign-roomr 11.12): the timeouts and
// limits shortened so scenarios run in seconds, the optional headers and the registrations. The
// same overrides drive the Go node (rendered into its roomr.yaml) and the fake node.

export type NodeOverrides = {
  maxRooms?: number;
  maxParticipants?: number;
  /** Durations as the node reads them: "1s", "200ms", "4h". */
  maxDuration?: string;
  mediaTimeout?: string;
  answerTimeout?: string;
  readyTimeout?: string;
  emptyRoomTimeout?: string;
  drainWait?: string;
  heartbeatInterval?: string;
  reregisterDelta?: number;
  region?: string;
  roomHeader?: string;
  callRefHeader?: string;
  codecs?: string[];
  /** Registrations against the suite's fake registrar (`registrar` filled in by the harness). */
  registrations?: {
    aor?: string;
    expires?: string;
    headers?: Record<string, string>;
    auth?: { username: string; password: string };
  }[];
};

/** Defaults the suite runs with: short enough for scenarios, long enough not to fire by accident. */
export const SUITE_DEFAULTS: NodeOverrides = {
  heartbeatInterval: "500ms",
  callRefHeader: "X-Call-Ref"
};

/** A duration in ms ("1s", "250ms", "2m", "1h"); `fallback` when unset or unreadable. */
export function durationMs(
  value: string | undefined,
  fallback: number
): number {
  if (!value) return fallback;
  const m = /^(\d+(?:\.\d+)?)(ms|s|m|h)$/.exec(value.trim());
  if (!m) return fallback;
  const n = Number(m[1]);
  return n * { ms: 1, s: 1000, m: 60_000, h: 3_600_000 }[m[2] as "ms"];
}

/** The node's roomr.yaml (as JSON, which is YAML) for the Go node. */
export function goNodeConfig(base: {
  nodeId: string;
  natsUrl: string;
  sipListen: string;
  controlListen: string;
  sessionEndpoint: string;
  outboundProxy: string;
  registrar: string;
  overrides: NodeOverrides;
}): Record<string, unknown> {
  const o = base.overrides;
  const optional = (key: keyof NodeOverrides) =>
    o[key] !== undefined ? { [key]: o[key] } : {};
  return {
    nodeId: base.nodeId,
    ...optional("region"),
    nats: { url: base.natsUrl },
    sip: {
      listen: base.sipListen,
      advertise: "127.0.0.1",
      outboundProxy: base.outboundProxy,
      ...(o.callRefHeader ? { callRefHeader: o.callRefHeader } : {}),
      ...(o.roomHeader ? { roomHeader: o.roomHeader } : {}),
      ...(o.registrations?.length
        ? {
            registrations: o.registrations.map((r) => ({
              registrar: base.registrar,
              ...(r.aor ? { aor: r.aor } : {}),
              ...(r.expires ? { expires: r.expires } : {}),
              ...(r.headers ? { headers: r.headers } : {}),
              ...(r.auth ? { auth: r.auth } : {})
            }))
          }
        : {})
    },
    rtp: { host: "127.0.0.1", advertise: "127.0.0.1" },
    control: { grpc: { listen: base.controlListen } },
    sessionEndpoint: base.sessionEndpoint,
    ...optional("maxRooms"),
    ...optional("maxParticipants"),
    ...optional("maxDuration"),
    ...optional("mediaTimeout"),
    ...optional("answerTimeout"),
    ...optional("readyTimeout"),
    ...optional("emptyRoomTimeout"),
    ...optional("drainWait"),
    ...optional("heartbeatInterval"),
    ...optional("reregisterDelta"),
    ...optional("codecs")
  };
}
