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
import { generateKeyPairSync, randomBytes } from "crypto";
import { createSocket } from "dgram";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { generateRegionHub } from "../../regions/hub";
import { writeWithMode } from "./envFile";

const hex = (bytes: number) => randomBytes(bytes).toString("hex");

/** A 32-byte key in base64 without + or / (valid for Cloak and the API server's check). */
export function encryptionKey(): string {
  for (;;) {
    const k = randomBytes(32).toString("base64");
    if (!/[+/]/.test(k)) return `k1.aesgcm256.${k}`;
  }
}

/**
 * The value `init` generates for an empty `.env` name, or undefined when the name is not a
 * secret. Passwords start with a letter: NATS parses a variable's value as config, and one
 * starting with a digit fails to load.
 */
export function generateSecret(name: string): string | undefined {
  if (name === "ENCRYPTION_KEY") return encryptionKey();
  if (name === "AUTOPILOT_SIGNING_SECRET") return hex(24);
  if (name === "OWNER_PASSWORD") return `p${hex(8)}`;
  if (/(_PASSWORD|_SECRET|_KEY|_TOKEN)$/.test(name)) return `s${hex(16)}`;
  return undefined;
}

/**
 * The IPv4 address of the default route's interface: a UDP socket "connected" to a public
 * address (no packet is sent) reports the source address the kernel would use.
 */
export function detectHostIp(timeoutMs = 2000): Promise<string | undefined> {
  return new Promise((resolve) => {
    const socket = createSocket("udp4");
    const done = (ip?: string) => {
      clearTimeout(timer);
      try {
        socket.close();
      } catch {
        // already closed
      }
      resolve(ip && ip !== "0.0.0.0" ? ip : undefined);
    };
    const timer = setTimeout(() => done(), timeoutMs);
    socket.on("error", () => done());
    try {
      socket.connect(53, "192.0.2.1", () => {
        try {
          done(socket.address().address);
        } catch {
          done();
        }
      });
    } catch {
      done();
    }
  });
}

/** Files the containers read: world-readable, not writable (they run as another user). */
export const CONTAINER_READ = 0o644;

function once(path: string, make: () => string | Buffer, created: string[]) {
  if (existsSync(path)) return;
  mkdirSync(dirname(path), { recursive: true, mode: 0o755 });
  writeWithMode(path, make().toString(), CONTAINER_READ);
  created.push(path);
}

/**
 * The keys of an install, each generated only when its file is missing (config/keys):
 * Identity's RS256 pair and the call-record ES256 key. The region hub's are `ensureRegionKeys`.
 */
export function ensureKeys(configDir: string): string[] {
  const keys = join(configDir, "keys");
  const created: string[] = [];
  if (!existsSync(join(keys, "private.pem"))) {
    const pair = generateKeyPairSync("rsa", { modulusLength: 2048 });
    mkdirSync(keys, { recursive: true, mode: 0o755 });
    const pub = join(keys, "public.pem");
    const priv = join(keys, "private.pem");
    writeWithMode(
      pub,
      pair.publicKey.export({ type: "spki", format: "pem" }).toString(),
      CONTAINER_READ
    );
    writeWithMode(
      priv,
      pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString(),
      CONTAINER_READ
    );
    created.push(priv, pub);
  }
  once(
    join(keys, "records.pem"),
    () =>
      generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey.export({
        type: "pkcs8",
        format: "pem"
      }),
    created
  );
  return created;
}

/** Where the region hub's leaf listener finds its TLS pair (inside the nats-regions container). */
export const LEAF_TLS = {
  certFile: "/etc/nats/tls/leaf.crt",
  keyFile: "/etc/nats/tls/leaf.key"
};

/**
 * The keys of a control plane that private regions join (`init --regions`), each generated only
 * when its file is missing: the region operator key (admin API), the region-signing key, and the
 * region hub (operator and account seeds, credentials, config/region-hub.conf with TLS on the leaf
 * listener).
 */
export function ensureRegionKeys(configDir: string): string[] {
  const keys = join(configDir, "keys");
  const created: string[] = [];
  once(join(keys, "region-operator.key"), () => hex(24), created);
  once(
    join(keys, "region-signing.pem"),
    () =>
      generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey.export({
        type: "pkcs8",
        format: "pem"
      }),
    created
  );
  const conf = join(configDir, "region-hub.conf");
  if (!existsSync(conf)) {
    const hub = generateRegionHub({ leafTls: LEAF_TLS });
    const dir = join(keys, "region-hub");
    const files: Record<string, string> = {
      "operator.seed": hub.operatorSeed,
      "account.seed": hub.accountSeed,
      "control-plane.creds": hub.controlPlaneCreds,
      "system.creds": hub.systemCreds
    };
    for (const [name, content] of Object.entries(files)) {
      mkdirSync(dir, { recursive: true, mode: 0o755 });
      writeWithMode(join(dir, name), content, CONTAINER_READ);
      created.push(join(dir, name));
    }
    writeWithMode(conf, hub.conf, CONTAINER_READ);
    created.push(conf);
  }
  return created;
}
