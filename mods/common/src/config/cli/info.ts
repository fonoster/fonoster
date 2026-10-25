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
import { join } from "path";
import { URL } from "url";
import { expandEnv, readEnvFile } from "./envFile";
import { tlsEnabled } from "./exposure";
import { localTlsOnDisk, usesOwnerCertificate } from "./tls";
import { Io } from "./types";

export type InfoOptions = { dir: string };

/** How to reach the install, from its local files only (.env). */
export function runInfo(options: InfoOptions, io: Io): number {
  const envFile = join(options.dir, ".env");
  if (!existsSync(envFile) || !existsSync(join(options.dir, "config"))) {
    io.err(
      "no .env here: run `npx -p @fonoster/common fonoster-config init` first"
    );
    return 1;
  }
  const env = expandEnv(readEnvFile(envFile));
  const host = env.HOST_IP || "localhost";
  const httpPort = env.HTTP_PORT || "8449";
  const sipPort = env.SIP_PORT || "5060";
  const publicUrl = env.PUBLIC_URL || `http://${host}:${httpPort}`;
  // compose.tls.yaml: Envoy serves HTTPS on 443 for PUBLIC_URL's host.
  let tlsHost = host;
  try {
    tlsHost = new URL(publicUrl).hostname;
  } catch {
    // Not a URL: check and init say so.
  }
  const api = tlsEnabled(env)
    ? `${tlsHost}:443 (gRPC and gRPC-Web, TLS)`
    : `${host}:${httpPort} (gRPC and gRPC-Web, plain HTTP)`;
  const lines = [
    `Dashboard   ${publicUrl}`,
    `Owner       ${env.OWNER_EMAIL || "(OWNER_EMAIL not set)"} / ${env.OWNER_PASSWORD || "(OWNER_PASSWORD not set)"}`,
    `API         ${api}`,
    `SIP         ${host}:${sipPort} (UDP and TCP)`,
    "",
    `Files       ${envFile}   Compose settings and the generated secrets (back it up)`,
    `            ${join(options.dir, "config")}/   service settings (from config/*.example.*)`,
    `            ${join(options.dir, "config", "keys")}/   signing keys`
  ];
  // The certificate init generated for getting started (https-by-default).
  const generated = usesOwnerCertificate(env, options.dir)
    ? undefined
    : localTlsOnDisk(options.dir);
  if (generated) {
    lines.push(
      `            ${join(options.dir, "config", "tls")}/   certificate generated for getting started`
    );
    if (tlsEnabled(env))
      lines.push(
        "",
        `Certificate ${generated.caCert}`,
        `            SHA-256 ${generated.caFingerprint}`,
        "            Generated for getting started: browsers show a warning once, and API clients",
        "            must trust this CA file. Use a real certificate (TLS_CERT and TLS_KEY) before",
        "            going live: https://docs.fonoster.com/self-hosting/https"
      );
  }
  lines.forEach((l) => io.out(l));
  return 0;
}
