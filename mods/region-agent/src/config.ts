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
import * as fs from "fs";
import { resolveSecretRefs } from "@fonoster/common";
import { parse } from "yaml";
import { z } from "zod";

// The region agent's YAML config (one file per service, PL5). Values that are secrets are named by
// environment variable, never written in the file.

const s3 = z
  .object({
    bucket: z.string(),
    prefix: z.string().optional(),
    region: z.string().optional(),
    endpoint: z.string().optional(),
    forcePathStyle: z.boolean().optional(),
    accessKeyIdEnv: z.string().optional(),
    secretAccessKeyEnv: z.string().optional()
  })
  .strict();

export const agentConfigSchema = z
  .object({
    /** Where `enroll` wrote the identity and leaf credentials (or the mounted Secret). */
    dataDir: z.string().default("/var/lib/fonoster-region"),
    /** Writable state (applied config version, Routr ref map, usage); default dataDir. */
    stateDir: z.string().optional(),
    /** The cell's own NATS server (with the leaf remote to the control plane). */
    // user/password: the agent's user on the cell's NATS (add-platform 4.1); password is usually
    // a secret:// reference.
    nats: z
      .object({
        url: z.string(),
        user: z.string().min(1).optional(),
        password: z.string().min(1).optional()
      })
      .strict(),
    /** The cell's database (the apiserver schema), where synced config lands. */
    database: z
      .object({
        url: z.string().optional(),
        urlEnv: z.string().default("APISERVER_DATABASE_URL"),
        encryptionKeyEnv: z.string().default("APISERVER_ENCRYPTION_KEY"),
        clientModule: z.string().optional()
      })
      .strict()
      .optional(),
    /** The cell's Routr API; omit to skip Routr resources. */
    routr: z
      .object({
        endpoint: z.string(),
        roomrPeer: z
          .object({
            name: z.string().default("Roomr nodes"),
            username: z.string().default("roomr"),
            aor: z.string().default("sip:roomr@default"),
            passwordEnv: z.string().default("RB_NODE_PASSWORD")
          })
          .strict()
          .optional()
      })
      .strict()
      .optional(),
    /** The cell's call-record store, for the relay. */
    records: z
      .object({
        store: z.union([
          z.object({ dir: z.string() }).strict(),
          z.object({ s3 }).strict()
        ])
      })
      .strict()
      .optional(),
    cellSecrets: z
      .object({
        file: z.string().optional(),
        dir: z.string().optional(),
        keyEnv: z.string().optional()
      })
      .strict()
      .optional(),
    /** The cell's hosted Autopilot (PR-9): Autopilot apps are pointed here. */
    autopilot: z
      .object({
        url: z.string(),
        signingSecretEnv: z.string().default("AUTOPILOT_SIGNING_SECRET")
      })
      .strict()
      .optional(),
    /**
     * The cell's AppBridge Service (its Session port): readiness is its grpc.health.v1 check
     * (redesign-roomr 15.5).
     */
    appbridge: z
      .object({ address: z.string().default("appbridge:50071") })
      .strict()
      .prefault({}),
    /**
     * The cell's public connection details (task 3.6). Unset fields come from the environment the
     * cell's services use (EXTERNAL_ADDRS, ROUTR_SIP_PORT/RB_SIP_PORT, ROUTR_SIP_TRANSPORTS,
     * RTPENGINE_PUBLIC_IP, RTPENGINE_PORT_MIN/MAX, ROOMR_RTP_*).
     */
    endpoints: z
      .object({
        sip: z
          .array(
            z
              .object({
                host: z.string(),
                port: z.number().int().positive(),
                transport: z.enum(["udp", "tcp", "tls", "ws", "wss"])
              })
              .strict()
          )
          .optional(),
        signalingAddresses: z.array(z.string()).optional(),
        mediaAddresses: z.array(z.string()).optional(),
        rtpPorts: z
          .object({ min: z.number().int(), max: z.number().int() })
          .strict()
          .optional()
      })
      .strict()
      .optional(),
    heartbeatMs: z.number().int().positive().default(30_000),
    /** Reported version (default: this package's). */
    version: z.string().optional()
  })
  .strict();

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export function loadAgentConfig(file: string): AgentConfig {
  // secret:// references (D8) resolve before validation.
  return agentConfigSchema.parse(
    resolveSecretRefs(parse(fs.readFileSync(file, "utf8")) ?? {})
  );
}

/** This package's version. */
export function packageVersion(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../package.json").version;
  } catch {
    return "0.0.0";
  }
}
