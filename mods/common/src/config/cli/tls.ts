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
import {
  createPrivateKey,
  generateKeyPairSync,
  KeyObject,
  X509Certificate
} from "crypto";
import { existsSync, mkdirSync, readFileSync } from "fs";
import { isAbsolute, join, resolve } from "path";
import { URL } from "url";
import { writeWithMode } from "./envFile";
import { CONTAINER_READ } from "./secrets";
import { createCertificate } from "./x509";

/**
 * The certificate init generates for getting started (https-by-default): a local CA and a server
 * certificate signed by it, in config/tls/. Clients trust ca.pem once; the server certificate is
 * reissued when its names change, so ca.pem stays the same. Not for going live: a real certificate
 * (TLS_CERT and TLS_KEY) replaces it.
 */
export const TLS_DIR = "tls";
export const CA_CERT = "ca.pem";
export const CA_KEY = "ca-key.pem";
export const SERVER_CERT = "server.pem";
export const SERVER_KEY = "server-key.pem";

const DAY = 24 * 60 * 60 * 1000;
const CA_DAYS = 3650;
const SERVER_DAYS = 397;
const RENEW_DAYS = 30;
const OWNER_ONLY = 0o600;
const CA_NAME = "Fonoster local CA";

export type LocalTlsResult =
  | { state: "owner" }
  | {
      state: "created" | "reissued" | "kept";
      dir: string;
      names: string[];
      caFingerprint: string;
    };

/** The names the server certificate covers: localhost, 127.0.0.1, HOST_IP and PUBLIC_URL's host. */
export function certificateNames(
  env: Record<string, string | undefined>
): string[] {
  const names = ["localhost", "127.0.0.1"];
  if (env.HOST_IP) names.push(env.HOST_IP);
  try {
    if (env.PUBLIC_URL)
      names.push(new URL(env.PUBLIC_URL).hostname.replace(/^\[|\]$/g, ""));
  } catch {
    // Not a URL: check says so.
  }
  return [...new Set(names.map((n) => n.toLowerCase()).filter(Boolean))];
}

function resolveIn(dir: string, file: string): string {
  return isAbsolute(file) ? file : resolve(dir, file);
}

/** Whether .env names the owner's own certificate (TLS_CERT/TLS_KEY set to other files). */
export function usesOwnerCertificate(
  env: Record<string, string | undefined>,
  dir: string
): boolean {
  if (!env.TLS_CERT && !env.TLS_KEY) return false;
  const tls = join(dir, "config", TLS_DIR);
  const generated =
    !!env.TLS_CERT &&
    !!env.TLS_KEY &&
    resolveIn(dir, env.TLS_CERT) === join(tls, SERVER_CERT) &&
    resolveIn(dir, env.TLS_KEY) === join(tls, SERVER_KEY);
  return !generated;
}

/** SHA-256 fingerprint of a PEM certificate, as `AB:CD:...`. */
export function fingerprint(pem: string): string {
  return new X509Certificate(pem).fingerprint256;
}

const newKeyPair = () => generateKeyPairSync("ec", { namedCurve: "P-256" });

const keyPem = (key: KeyObject) =>
  key.export({ type: "pkcs8", format: "pem" }).toString();

function newCa(now: Date) {
  const { publicKey, privateKey } = newKeyPair();
  const cert = createCertificate({
    publicKey,
    subject: CA_NAME,
    issuer: CA_NAME,
    signingKey: privateKey,
    notBefore: new Date(now.getTime() - DAY),
    notAfter: new Date(now.getTime() + CA_DAYS * DAY),
    ca: true
  });
  return { cert, key: keyPem(privateKey) };
}

function newServer(caKeyPem: string, names: string[], now: Date) {
  const { publicKey, privateKey } = newKeyPair();
  const cert = createCertificate({
    publicKey,
    subject: names[0],
    issuer: CA_NAME,
    signingKey: createPrivateKey(caKeyPem),
    notBefore: new Date(now.getTime() - DAY),
    notAfter: new Date(now.getTime() + SERVER_DAYS * DAY),
    ca: false,
    names
  });
  return { cert, key: keyPem(privateKey) };
}

/**
 * A local CA and a server certificate for `names` (DNS names or IP addresses), in memory: the
 * same certificates `init` writes to config/tls/. For tests and tools that need a trusted TLS
 * server without files.
 */
export function issueCertificates(
  names: string[],
  now: Date = new Date()
): {
  ca: { cert: string; key: string };
  server: { cert: string; key: string };
} {
  const ca = newCa(now);
  return { ca, server: newServer(ca.key, names, now) };
}

/** The names an existing server certificate covers (DNS and IP SANs), lowercased. */
function coveredNames(pem: string): Set<string> {
  const san = new X509Certificate(pem).subjectAltName ?? "";
  return new Set(
    san
      .split(/,\s*/)
      .map((e) => e.replace(/^(DNS|IP Address):/, "").toLowerCase())
      .filter(Boolean)
  );
}

function needsReissue(
  serverPem: string,
  caPem: string,
  names: string[],
  now: Date
): boolean {
  const cert = new X509Certificate(serverPem);
  const ca = new X509Certificate(caPem);
  if (!cert.checkIssued(ca) || !cert.verify(ca.publicKey)) return true;
  if (new Date(cert.validTo).getTime() - now.getTime() < RENEW_DAYS * DAY)
    return true;
  const covered = coveredNames(serverPem);
  return covered.size !== names.length || names.some((n) => !covered.has(n));
}

/**
 * Creates or keeps config/tls/ for the generated certificate. Generates nothing when .env names
 * the owner's certificate. The CA is kept byte for byte once it exists; the server certificate is
 * reissued only when its names change, it nears expiry (30 days) or the CA changed.
 */
export function ensureLocalTls(
  dir: string,
  env: Record<string, string | undefined>,
  now: Date = new Date()
): LocalTlsResult {
  if (usesOwnerCertificate(env, dir)) return { state: "owner" };
  const tls = join(dir, "config", TLS_DIR);
  const paths = {
    caCert: join(tls, CA_CERT),
    caKey: join(tls, CA_KEY),
    cert: join(tls, SERVER_CERT),
    key: join(tls, SERVER_KEY)
  };
  const names = certificateNames(env);
  mkdirSync(tls, { recursive: true, mode: 0o755 });

  let state: "created" | "reissued" | "kept" = "kept";
  if (!existsSync(paths.caCert) || !existsSync(paths.caKey)) {
    const ca = newCa(now);
    writeWithMode(paths.caKey, ca.key, OWNER_ONLY);
    writeWithMode(paths.caCert, ca.cert, CONTAINER_READ);
    state = "created";
  }
  const caCert = readFileSync(paths.caCert, "utf8");
  if (
    state === "created" ||
    !existsSync(paths.cert) ||
    !existsSync(paths.key) ||
    needsReissue(readFileSync(paths.cert, "utf8"), caCert, names, now)
  ) {
    const server = newServer(readFileSync(paths.caKey, "utf8"), names, now);
    writeWithMode(paths.key, server.key, OWNER_ONLY);
    writeWithMode(paths.cert, server.cert, CONTAINER_READ);
    if (state === "kept") state = "reissued";
  }
  return { state, dir: tls, names, caFingerprint: fingerprint(caCert) };
}

/** The generated certificate's state on disk, for info and check (reads files only). */
export function localTlsOnDisk(
  dir: string
): { caCert: string; caFingerprint: string } | undefined {
  const caCert = join(dir, "config", TLS_DIR, CA_CERT);
  if (!existsSync(caCert)) return undefined;
  try {
    return { caCert, caFingerprint: fingerprint(readFileSync(caCert, "utf8")) };
  } catch {
    return undefined;
  }
}
