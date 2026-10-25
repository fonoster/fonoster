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
import { existsSync } from "fs";
import { BlockList, isIP } from "net";
import { isAbsolute, resolve } from "path";
import { URL } from "url";
import { usesOwnerCertificate } from "./tls";

/** The Compose file that turns HTTPS off (plain HTTP on HTTP_PORT, for a TLS proxy in front). */
export const HTTP_COMPOSE_FILE = "compose.http.yaml";
/** The old opt-in for HTTPS; HTTPS is the default now, so this file only keeps old .env files working. */
export const TLS_COMPOSE_FILE = "compose.tls.yaml";

/** Loopback, private and link-local ranges: a URL on them is not reachable from the internet. */
const LOCAL = new BlockList();
LOCAL.addSubnet("127.0.0.0", 8);
LOCAL.addSubnet("10.0.0.0", 8);
LOCAL.addSubnet("172.16.0.0", 12);
LOCAL.addSubnet("192.168.0.0", 16);
LOCAL.addSubnet("169.254.0.0", 16);
LOCAL.addSubnet("100.64.0.0", 10);
LOCAL.addAddress("::1", "ipv6");
LOCAL.addSubnet("fc00::", 7, "ipv6");
LOCAL.addSubnet("fe80::", 10, "ipv6");

export function isLocalHost(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local"))
    return true;
  const family = isIP(h);
  if (family === 0) return false;
  return LOCAL.check(h, family === 6 ? "ipv6" : "ipv4");
}

/** Whether COMPOSE_FILE (`:`-, `,`- or `;`-separated) names a file. */
function composeFileNames(
  env: Record<string, string | undefined>,
  file: string
): boolean {
  return (env.COMPOSE_FILE ?? "")
    .split(/[:,;]/)
    .some((f) => f.trim().replace(/^\.\//, "") === file);
}

/** Whether Envoy serves HTTPS: the default, unless COMPOSE_FILE names compose.http.yaml. */
export function tlsEnabled(env: Record<string, string | undefined>): boolean {
  return !composeFileNames(env, HTTP_COMPOSE_FILE);
}

const PLAIN_HTTP =
  "COMPOSE_FILE=compose.yaml:compose.http.yaml (plain HTTP for a TLS proxy in front, see .env.example)";

/**
 * Warnings about how the dashboard and API are exposed (M10): plain HTTP on an address the
 * internet may reach, or an HTTPS setup that is incomplete. They never stop init or check.
 */
export function exposureWarnings(
  env: Record<string, string | undefined>,
  dir: string
): string[] {
  const warnings: string[] = [];
  const publicUrl = env.PUBLIC_URL ?? "";
  let url: URL | undefined;
  try {
    url = new URL(publicUrl);
  } catch {
    if (publicUrl)
      warnings.push(`PUBLIC_URL "${publicUrl}" is not a URL (http(s)://host)`);
  }
  const tls = tlsEnabled(env);

  if (tls) {
    if (!!env.TLS_CERT !== !!env.TLS_KEY)
      warnings.push(
        "set both TLS_CERT and TLS_KEY (your certificate), or neither (the generated one)"
      );
    ["TLS_CERT", "TLS_KEY"].forEach((name) => {
      const file = env[name];
      if (file && !existsSync(isAbsolute(file) ? file : resolve(dir, file)))
        warnings.push(`${name}: ${file} not found on this machine`);
    });
    if (url && url.protocol !== "https:")
      warnings.push(
        `HTTPS is the default now but PUBLIC_URL is ${url.protocol}//: set PUBLIC_URL=https://<host> and run init again, or keep plain HTTP with ${PLAIN_HTTP}`
      );
    // The generated certificate is for getting started: a public domain needs a real one.
    if (
      url &&
      !usesOwnerCertificate(env, dir) &&
      isIP(url.hostname.replace(/^\[|\]$/g, "")) === 0 &&
      !isLocalHost(url.hostname)
    )
      warnings.push(
        `PUBLIC_URL is ${url.origin} but HTTPS uses the certificate init generated for getting started: browsers warn and clients must trust config/tls/ca.pem (--ca-file). Set TLS_CERT and TLS_KEY to a real certificate before going live (https://docs.fonoster.com/self-hosting/https)`
      );
    return warnings;
  }

  if (env.TLS_CERT || env.TLS_KEY)
    warnings.push(
      `TLS_CERT/TLS_KEY are set but COMPOSE_FILE names ${HTTP_COMPOSE_FILE}: Envoy serves plain HTTP`
    );
  if (url?.protocol === "http:" && !isLocalHost(url.hostname))
    warnings.push(
      `PUBLIC_URL is ${url.origin}: the dashboard and API (passwords, API keys, tokens) go over plain HTTP to an address others may reach. Put a TLS proxy in front (HTTP_BIND=127.0.0.1, PUBLIC_URL=https://<its domain>), or drop ${HTTP_COMPOSE_FILE} from COMPOSE_FILE for HTTPS`
    );
  return warnings;
}
