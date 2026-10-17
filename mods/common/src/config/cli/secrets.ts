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
import { writeWithMode } from "./envFile";

const hex = (bytes: number) => randomBytes(bytes).toString("hex");

/** A Cloak key (`npx @47ng/cloak generate` format): base64url of 32 random bytes. */
export function encryptionKey(): string {
  return `k1.aesgcm256.${randomBytes(32).toString("base64url")}=`;
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
 * Identity's RS256 pair and the call-record ES256 key. Hosting private regions is a manual
 * addition (fonoster-region-hub-setup in the apiserver image), not part of init.
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
