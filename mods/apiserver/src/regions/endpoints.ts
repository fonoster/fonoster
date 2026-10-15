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
import { createHash } from "crypto";

export const SIP_TRANSPORTS = ["udp", "tcp", "tls", "ws", "wss"] as const;
export type SipTransport = (typeof SIP_TRANSPORTS)[number];

/** A region's connection details (contract §3 `region.R.endpoints`, §3a). */
export type RegionEndpoints = {
  sip: { host: string; port: number; transport: SipTransport }[];
  signalingAddresses: string[];
  mediaAddresses: string[];
  rtpPorts?: { min: number; max: number };
  updatedAt?: string;
};

const HOST = /^[A-Za-z0-9.:\-[\]]{1,253}$/;
const port = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 && n < 65536 ? n : undefined;
};
const addresses = (v: unknown) =>
  Array.isArray(v)
    ? [
        ...new Set(
          v.map((a) => String(a).trim()).filter((a) => a && HOST.test(a))
        )
      ].slice(0, 32)
    : [];

/**
 * Validates and cleans what a cell (or the config) reports: unknown transports, bad hosts and
 * ports are dropped; undefined when nothing usable is left.
 */
export function normalizeEndpoints(body: unknown): RegionEndpoints | undefined {
  if (!body || typeof body !== "object") return undefined;
  const b = body as Record<string, unknown>;
  const sip = (Array.isArray(b.sip) ? b.sip : [])
    .map((e) => {
      const r = (e ?? {}) as Record<string, unknown>;
      const host = String(r.host ?? "").trim();
      const transport = String(r.transport ?? "udp").toLowerCase();
      const p = port(r.port);
      if (!host || !HOST.test(host) || !p) return undefined;
      if (!SIP_TRANSPORTS.includes(transport as SipTransport)) return undefined;
      return { host, port: p, transport: transport as SipTransport };
    })
    .filter((e): e is RegionEndpoints["sip"][number] => !!e)
    .slice(0, 16);
  const signalingAddresses = addresses(b.signalingAddresses);
  const mediaAddresses = addresses(b.mediaAddresses);
  const r = (b.rtpPorts ?? {}) as Record<string, unknown>;
  const min = port(r.min);
  const max = port(r.max);
  const rtpPorts = min && max && min <= max ? { min, max } : undefined;
  if (!sip.length && !signalingAddresses.length && !mediaAddresses.length)
    return undefined;
  const updatedAt =
    typeof b.updatedAt === "string" && !isNaN(Date.parse(b.updatedAt))
      ? new Date(b.updatedAt).toISOString()
      : undefined;
  return {
    sip,
    signalingAddresses,
    mediaAddresses,
    ...(rtpPorts ? { rtpPorts } : {}),
    ...(updatedAt ? { updatedAt } : {})
  };
}

/**
 * `endpointsHash` (contract §3, RE-B2), the region agent's algorithm (RC-B16): the first 16 hex
 * characters of the sha256 of
 * `{"sip":[[host,port,transport]…],"signalingAddresses":[…],"mediaAddresses":[…],"rtpPorts":[min,max]|null}`
 * in the order the cell sent them; `updatedAt` left out.
 */
export function endpointsHash(e: {
  sip?: { host: unknown; port: unknown; transport: unknown }[];
  signalingAddresses?: unknown[];
  mediaAddresses?: unknown[];
  rtpPorts?: { min: unknown; max: unknown } | null;
}): string {
  const canonical = JSON.stringify({
    sip: (e.sip ?? []).map((s) => [s.host, s.port, s.transport]),
    signalingAddresses: e.signalingAddresses ?? [],
    mediaAddresses: e.mediaAddresses ?? [],
    rtpPorts: e.rtpPorts ? [e.rtpPorts.min, e.rtpPorts.max] : null
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
