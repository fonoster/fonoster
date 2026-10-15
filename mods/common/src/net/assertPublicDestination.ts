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
import dns from "node:dns";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { URL } from "node:url";

/* global Response, Headers */

/**
 * Outbound requests to tenant-chosen URLs (Autopilot HTTP tools, webhooks) must not reach the
 * platform's own network (SSRF, RV-B2): http/https only, and every address the host resolves to
 * must be public. Operators who self-host can allow internal destinations with
 * `FONOSTER_ALLOWED_DESTINATIONS` (comma-separated host names, IPs or CIDRs; default empty).
 */
export class UnsafeDestinationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeDestinationError";
  }
}

export type DestinationPolicy = {
  /** Host names, IPs or CIDRs allowed although private; defaults to FONOSTER_ALLOWED_DESTINATIONS. */
  allow?: string[];
};

const blocked = new net.BlockList();
for (const [net4, prefix] of [
  ["0.0.0.0", 8], // "this network", 0.0.0.0
  ["10.0.0.0", 8],
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8],
  ["169.254.0.0", 16], // link-local, cloud metadata
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4] // reserved, broadcast
] as const)
  blocked.addSubnet(net4, prefix, "ipv4");
for (const [net6, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96], // NAT64 can reach IPv4 private ranges
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7], // ULA
  ["fe80::", 10], // link-local
  ["ff00::", 8] // multicast
] as const)
  blocked.addSubnet(net6, prefix, "ipv6");

const INTERNAL_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".intranet",
  ".lan",
  ".home.arpa",
  ".cluster.local",
  ".svc"
];

/** The IPv4 address inside an IPv4-mapped IPv6 address (::ffff:a.b.c.d or ::ffff:hhhh:hhhh). */
function mappedV4(ip: string): string | undefined {
  const m = /^::ffff:(.+)$/i.exec(ip);
  if (!m) return undefined;
  if (net.isIPv4(m[1])) return m[1];
  const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(m[1]);
  if (!hex) return undefined;
  const hi = parseInt(hex[1], 16);
  const lo = parseInt(hex[2], 16);
  return [hi >> 8, hi & 255, lo >> 8, lo & 255].join(".");
}

/** True when the address is loopback, private, link-local, ULA, CGNAT, multicast or reserved. */
export function isPrivateAddress(ip: string): boolean {
  const bare = ip.replace(/^\[|\]$/g, "").split("%")[0];
  const v4 = mappedV4(bare);
  if (v4) return blocked.check(v4, "ipv4");
  if (net.isIPv4(bare)) return blocked.check(bare, "ipv4");
  if (net.isIPv6(bare)) return blocked.check(bare, "ipv6");
  return true; // not an address: refuse
}

function allowList(policy?: DestinationPolicy): string[] {
  return (
    policy?.allow ??
    (process.env.FONOSTER_ALLOWED_DESTINATIONS ?? "").split(",")
  )
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function allowedByOperator(
  host: string,
  ip: string | undefined,
  allow: string[]
): boolean {
  for (const entry of allow) {
    if (entry === host) return true;
    if (!ip) continue;
    const [base, bits] = entry.split("/");
    if (!net.isIP(base)) continue;
    const family = net.isIPv4(base) ? "ipv4" : "ipv6";
    const list = new net.BlockList();
    const prefix = bits ? Number(bits) : family === "ipv4" ? 32 : 128;
    list.addSubnet(base, prefix, family);
    const target = mappedV4(ip) ?? ip;
    const targetFamily = net.isIPv4(target) ? "ipv4" : "ipv6";
    if (targetFamily === family && list.check(target, family)) return true;
  }
  return false;
}

function checkAddress(host: string, ip: string, allow: string[]) {
  if (isPrivateAddress(ip) && !allowedByOperator(host, ip, allow))
    throw new UnsafeDestinationError(
      `destination ${host} resolves to a non-public address`
    );
}

function hostOf(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

/** Throws unless the URL is http(s) and its host is public, before any DNS lookup. */
function checkUrlShape(url: URL, allow: string[]): string {
  if (url.protocol !== "http:" && url.protocol !== "https:")
    throw new UnsafeDestinationError(`unsupported scheme ${url.protocol}`);
  const host = hostOf(url);
  if (!host) throw new UnsafeDestinationError("missing host");
  if (net.isIP(host)) {
    checkAddress(host, host, allow);
    return host;
  }
  if (allow.includes(host)) return host;
  const name = host.replace(/\.$/, "");
  if (
    !name.includes(".") ||
    name === "localhost" ||
    INTERNAL_SUFFIXES.some((s) => name.endsWith(s))
  )
    throw new UnsafeDestinationError(`destination ${host} is an internal name`);
  return host;
}

/**
 * Checks a tenant-chosen URL: http/https, not an internal name, and every resolved address
 * public (or allowed by the operator). Returns the parsed URL.
 */
export async function assertPublicDestination(
  input: string | URL,
  policy?: DestinationPolicy
): Promise<URL> {
  let url: URL;
  try {
    url = new URL(String(input));
  } catch {
    throw new UnsafeDestinationError("invalid URL");
  }
  const allow = allowList(policy);
  const host = checkUrlShape(url, allow);
  if (net.isIP(host) || allow.includes(host)) return url;
  let addresses: dns.LookupAddress[];
  try {
    addresses = await dns.promises.lookup(host, { all: true });
  } catch {
    throw new UnsafeDestinationError(`cannot resolve ${host}`);
  }
  for (const a of addresses) checkAddress(host, a.address, allow);
  return url;
}

/** Synchronous shape check (scheme, literal IPs, internal names) for request validation. */
export function assertPublicUrlShape(
  input: string | URL,
  policy?: DestinationPolicy
): URL {
  let url: URL;
  try {
    url = new URL(String(input));
  } catch {
    throw new UnsafeDestinationError("invalid URL");
  }
  checkUrlShape(url, allowList(policy));
  return url;
}

export type SafeFetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
  /** Whole-request timeout (default 10 s). */
  timeoutMs?: number;
  /** Redirects followed, each re-checked (default 3). */
  maxRedirects?: number;
  /** Largest response body read (default 5 MiB). */
  maxBytes?: number;
  policy?: DestinationPolicy;
};

const NO_BODY = new Set([101, 204, 205, 304]);

function requestOnce(
  url: URL,
  init: SafeFetchInit,
  method: string,
  body: string | undefined,
  signal: AbortSignal,
  allow: string[]
): Promise<Response> {
  const host = hostOf(url);
  // The connection is checked when the socket resolves the name, so a DNS answer that changes
  // between the check and the request (rebinding) cannot reach a private address.
  const lookup: net.LookupFunction = (hostname, options, callback) => {
    dns.lookup(hostname, { ...options, all: true }, (err, addrs) => {
      if (err) return callback(err, "", 4);
      const list = addrs as unknown as dns.LookupAddress[];
      try {
        for (const a of list) checkAddress(host, a.address, allow);
      } catch (e) {
        return callback(e as Error, "", 4);
      }
      if ((options as { all?: boolean }).all)
        return (
          callback as unknown as (e: null, a: dns.LookupAddress[]) => void
        )(null, list);
      callback(null, list[0].address, list[0].family);
    });
  };
  const lib = url.protocol === "https:" ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      url,
      {
        method,
        headers: {
          ...(init.headers ?? {}),
          ...(body !== undefined
            ? { "content-length": String(Buffer.byteLength(body)) }
            : {})
        },
        lookup,
        signal
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        const max = init.maxBytes ?? 5 * 1024 * 1024;
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > max) {
            res.destroy(new UnsafeDestinationError("response too large"));
            return;
          }
          chunks.push(c);
        });
        res.on("error", reject);
        res.on("end", () => {
          const headers = new Headers();
          for (const [k, v] of Object.entries(res.headers)) {
            if (v === undefined) continue;
            for (const item of Array.isArray(v) ? v : [v])
              headers.append(k, item);
          }
          const status = res.statusCode ?? 0;
          resolve(
            new Response(NO_BODY.has(status) ? null : Buffer.concat(chunks), {
              status: status < 200 || status > 599 ? 502 : status,
              statusText: res.statusMessage,
              headers
            })
          );
        });
      }
    );
    req.on("error", reject);
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/**
 * fetch for tenant-chosen URLs: checks the destination (and each redirect) with
 * assertPublicDestination, re-checks the addresses the socket connects to, and times out.
 */
export async function safeFetch(
  input: string | URL,
  init: SafeFetchInit = {}
): Promise<Response> {
  const allow = allowList(init.policy);
  const timeout = AbortSignal.timeout(init.timeoutMs ?? 10_000);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  let url = await assertPublicDestination(input, { allow });
  let method = (init.method ?? "GET").toUpperCase();
  let body = init.body;
  const maxRedirects = init.maxRedirects ?? 3;
  for (let hop = 0; ; hop++) {
    const res = await requestOnce(url, init, method, body, signal, allow);
    const location = res.headers.get("location");
    if (![301, 302, 303, 307, 308].includes(res.status) || !location)
      return res;
    if (hop >= maxRedirects)
      throw new UnsafeDestinationError("too many redirects");
    url = await assertPublicDestination(new URL(location, url), { allow });
    if (res.status === 303 || (res.status <= 302 && method === "POST")) {
      method = "GET";
      body = undefined;
    }
  }
}
