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

/** The Compose file that turns on HTTPS in Envoy (ops/bundle/compose.tls.yaml). */
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

/** Whether .env turns on compose.tls.yaml (COMPOSE_FILE, `:`- or `,`-separated). */
export function tlsEnabled(env: Record<string, string | undefined>): boolean {
  return (env.COMPOSE_FILE ?? "")
    .split(/[:,;]/)
    .some((f) => f.trim().replace(/^\.\//, "") === TLS_COMPOSE_FILE);
}

const HOW =
  "set COMPOSE_FILE=compose.yaml:compose.tls.yaml with TLS_CERT and TLS_KEY in .env (see .env.example), or put a TLS proxy in front with HTTP_BIND=127.0.0.1";

/**
 * SIP names (trunk inbound URIs, domains) live under SIP_DOMAIN. When the dashboard has a public
 * name but SIP_DOMAIN is a local one, carriers and phones can't resolve those names.
 */
function sipDomainWarning(
  sipDomain: string | undefined,
  url: URL | undefined
): string | undefined {
  const domain = sipDomain || "fonoster.local";
  if (!url || isIP(url.hostname) !== 0 || isLocalHost(url.hostname)) return;
  if (!isLocalHost(domain)) return;
  const labels = url.hostname.split(".");
  const suggestion =
    labels.length > 2 ? labels.slice(1).join(".") : url.hostname;
  return `PUBLIC_URL is on ${url.hostname} but SIP_DOMAIN is ${domain}: trunks get inbound URIs like acme.pstn.${domain}, which carriers can't reach. Set SIP_DOMAIN (for example SIP_DOMAIN=${suggestion}) and run init again`;
}

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
  const sipWarning = sipDomainWarning(env.SIP_DOMAIN, url);
  if (sipWarning) warnings.push(sipWarning);
  const tls = tlsEnabled(env);

  if (tls) {
    ["TLS_CERT", "TLS_KEY"].forEach((name) => {
      const file = env[name];
      if (!file)
        warnings.push(
          `COMPOSE_FILE names ${TLS_COMPOSE_FILE} but ${name} is not set: Compose will refuse to start`
        );
      else if (!existsSync(isAbsolute(file) ? file : resolve(dir, file)))
        warnings.push(`${name}: ${file} not found on this machine`);
    });
    if (url && url.protocol !== "https:")
      warnings.push(
        `HTTPS is on (${TLS_COMPOSE_FILE}) but PUBLIC_URL is ${url.protocol}//: set PUBLIC_URL=https://<the certificate's domain> and run init again`
      );
    return warnings;
  }

  if (env.TLS_CERT || env.TLS_KEY)
    warnings.push(
      `TLS_CERT/TLS_KEY are set but COMPOSE_FILE does not name ${TLS_COMPOSE_FILE}: Envoy still serves plain HTTP`
    );
  if (url?.protocol === "http:" && !isLocalHost(url.hostname))
    warnings.push(
      `PUBLIC_URL is ${url.origin}: the dashboard and API (passwords, API keys, tokens) go over plain HTTP to an address others may reach. For HTTPS, ${HOW}`
    );
  return warnings;
}
