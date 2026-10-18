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
import { Endpoints, SipEndpoint } from "./types";

// The cell's connection details (contract `region.R.endpoints`, task 3.6, RC-B16): the PUBLIC
// addresses carriers and softphones use. Taken from the same settings the cell's Routr, RTPEngine
// and media node run with (EXTERNAL_ADDRS, RTPENGINE_PUBLIC_IP, port ranges, …); every field can be
// set by hand in the agent config, and a set field wins.

export type EndpointsOverride = {
  sip?: SipEndpoint[];
  signalingAddresses?: string[];
  mediaAddresses?: string[];
  rtpPorts?: { min: number; max: number };
};

type Env = Record<string, string | undefined>;

const list = (v?: string) =>
  (v ?? "")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);

const TRANSPORTS = ["udp", "tcp", "tls", "ws", "wss"] as const;

/** The endpoints from the override and the environment; undefined when nothing is known. */
export function resolveEndpoints(
  override: EndpointsOverride = {},
  env: Env = process.env
): Omit<Endpoints, "type" | "updatedAt"> | undefined {
  const signaling = override.signalingAddresses ?? list(env.EXTERNAL_ADDRS);
  const port = Number(env.ROUTR_SIP_PORT ?? env.RB_SIP_PORT ?? 5060);
  const transports = list(env.ROUTR_SIP_TRANSPORTS ?? "udp,tcp")
    .map((t) => t.toLowerCase())
    .filter((t): t is SipEndpoint["transport"] =>
      (TRANSPORTS as readonly string[]).includes(t)
    );
  const sipHost = env.ROUTR_SIP_HOST ?? signaling[0];
  const sip =
    override.sip ??
    (sipHost
      ? transports.map((transport) => ({ host: sipHost, port, transport }))
      : []);
  const media =
    override.mediaAddresses ??
    list(
      env.RTPENGINE_PUBLIC_IP ?? env.ROOMR_RTP_ADVERTISE ?? env.EXTERNAL_ADDRS
    );
  const min = Number(env.RTPENGINE_PORT_MIN ?? env.ROOMR_RTP_PORT_MIN);
  const max = Number(env.RTPENGINE_PORT_MAX ?? env.ROOMR_RTP_PORT_MAX);
  const rtpPorts =
    override.rtpPorts ??
    (Number.isInteger(min) && Number.isInteger(max) && min > 0 && max >= min
      ? { min, max }
      : undefined);
  if (!sip.length && !signaling.length && !media.length && !rtpPorts)
    return undefined;
  return {
    sip,
    signalingAddresses: signaling,
    mediaAddresses: media,
    ...(rtpPorts ? { rtpPorts } : {})
  };
}

/** A short stable hash of the endpoints (without updatedAt), for heartbeats. */
export function endpointsHash(e: Omit<Endpoints, "type" | "updatedAt">) {
  const canonical = JSON.stringify({
    sip: e.sip.map((s) => [s.host, s.port, s.transport]),
    signalingAddresses: e.signalingAddresses,
    mediaAddresses: e.mediaAddresses,
    rtpPorts: e.rtpPorts ? [e.rtpPorts.min, e.rtpPorts.max] : null
  });
  return createHash("sha256").update(canonical).digest("hex").slice(0, 16);
}
