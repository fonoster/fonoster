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
import { z } from "zod";
import type { GatewayConfig } from "./config";

// gateway.yaml as a Zod schema (add-self-host-installer 4.1, build log IC-B4): the gateway
// validates with `validateConfig` (cross-field rules); this schema describes the file's shape so
// the bundle can ship a JSON Schema for `fonoster-config check`. It must match `GatewayConfig`
// exactly: the type check at the bottom fails the build when they drift.

const recordingPolicy = z.enum(["off", "on", "consent"]);

const objectStore = z.union([
  z.object({ dir: z.string() }),
  z.object({
    s3: z.object({
      bucket: z.string(),
      prefix: z.string().optional(),
      region: z.string().optional(),
      endpoint: z.string().optional(),
      forcePathStyle: z.boolean().optional(),
      credentials: z
        .object({ accessKeyId: z.string(), secretAccessKey: z.string() })
        .optional()
    })
  })
]);

const app = z.object({
  ref: z.string(),
  url: z.string(),
  flavor: z.enum(["native", "twilio"]),
  signingSecret: z.string(),
  speech: z.object({
    voice: z.string(),
    language: z.string(),
    silenceTimeoutMs: z.number().optional(),
    patience: z.enum(["low", "normal", "high"]).optional(),
    detector: z.string().optional(),
    sttModel: z.string().optional(),
    hints: z.array(z.string()).optional()
  }),
  audio: z
    .object({ codec: z.enum(["pcm16", "pcmu"]), rate: z.number() })
    .optional(),
  workspaceRef: z.string().optional(),
  numbers: z.array(z.string()).optional(),
  fallback: z
    .object({ app: z.string().optional(), message: z.string().optional() })
    .optional(),
  filters: z
    .array(
      z.object({
        name: z.string(),
        options: z.record(z.unknown()).optional()
      })
    )
    .optional(),
  listeners: z
    .array(
      z.object({
        url: z.string(),
        tracks: z.enum(["inbound", "outbound", "both"]).optional()
      })
    )
    .optional(),
  recording: recordingPolicy.optional(),
  amd: z
    .union([
      z.boolean(),
      z.object({
        enabled: z.boolean().optional(),
        windowMs: z.number().optional()
      })
    ])
    .optional()
});

const provider = z.object({
  adapter: z.enum(["fake", "deepgram", "elevenlabs"]),
  capabilities: z.array(z.enum(["tts", "stt"])),
  credential: z
    .object({ env: z.string().optional(), value: z.string().optional() })
    .optional(),
  tts: z
    .object({
      url: z.string().optional(),
      timeoutMs: z.number().optional(),
      model: z.string().optional()
    })
    .optional(),
  stt: z
    .object({ url: z.string().optional(), model: z.string().optional() })
    .optional(),
  voices: z.array(z.string()).optional()
});

export const gatewayConfigSchema = z.object({
  nats: z.object({
    url: z.string(),
    user: z.string().optional(),
    password: z.string().optional()
  }),
  rtp: z
    .object({
      host: z.string().optional(),
      advertiseHost: z.string().optional(),
      advertiseHostEnv: z.string().optional(),
      srtp: z.boolean().optional()
    })
    .optional(),
  apps: z.array(app).optional(),
  providers: z.record(provider),
  stt: z.object({ provider: z.string().optional() }).optional(),
  retry: z
    .object({
      windowMs: z.number().optional(),
      intervalMs: z.number().optional()
    })
    .optional(),
  outputQueueMaxMs: z.number().optional(),
  http: z
    .object({
      host: z.string().optional(),
      port: z.number(),
      accountSid: z.string().optional(),
      authToken: z.string().optional(),
      identity: z.object({ endpoint: z.string() }).optional()
    })
    .optional(),
  registry: z
    .object({
      file: z.string().optional(),
      source: z.enum(["file", "database"]).optional(),
      refreshMs: z.number().optional()
    })
    .optional(),
  database: z
    .object({
      url: z.string().optional(),
      urlEnv: z.string().optional(),
      encryptionKeyEnv: z.string().optional(),
      clientModule: z.string().optional()
    })
    .optional(),
  workspaceKeys: z
    .object({ enabled: z.boolean(), cacheMs: z.number().optional() })
    .optional(),
  cellSecrets: z
    .object({
      file: z.string().optional(),
      dir: z.string().optional(),
      keyEnv: z.string().optional(),
      workspaceKeysFromCloud: z.boolean().optional()
    })
    .optional(),
  appStore: z
    .object({
      source: z.enum(["yaml", "database"]),
      cacheMs: z.number().optional()
    })
    .optional(),
  webhooks: z
    .object({
      enabled: z.boolean(),
      transport: z.enum(["database", "bus"]).optional(),
      intervalMs: z.number().optional(),
      refreshMs: z.number().optional(),
      allowInsecureUrls: z.boolean().optional(),
      allowedDestinations: z.array(z.string()).optional()
    })
    .optional(),
  keepalive: z
    .object({
      pingIntervalMs: z.number().optional(),
      idleTimeoutMs: z.number().optional()
    })
    .optional(),
  amd: z
    .object({
      enabled: z.boolean().optional(),
      modelDir: z.string().optional()
    })
    .optional(),
  callRecord: z
    .object({
      dir: z.string(),
      region: z.string(),
      signingKey: z.object({
        kid: z.string().optional(),
        privateKeyFile: z.string().optional(),
        dir: z.string().optional(),
        jku: z.string().optional()
      }),
      keyHistory: z
        .array(z.object({ kid: z.string(), publicKeyFile: z.string() }))
        .optional(),
      sweepIntervalMs: z.number().optional(),
      store: objectStore.optional(),
      recording: recordingPolicy.optional(),
      workspaces: z
        .record(
          z.object({
            recording: recordingPolicy.optional(),
            store: objectStore.optional()
          })
        )
        .optional(),
      consentPrompt: z.string().optional(),
      recordUrl: z.string().optional(),
      analytics: z
        .object({
          clickhouse: z.object({
            url: z.string(),
            database: z.string().optional(),
            table: z.string().optional(),
            userEnv: z.string().optional(),
            passwordEnv: z.string().optional()
          })
        })
        .optional()
    })
    .optional(),
  testMode: z.boolean().optional()
});

// Drift check: the schema and GatewayConfig must describe the same shape. Optionality is
// ignored (the package is not compiled with strictNullChecks, so Zod marks every key optional).
type DeepRequired<T> = T extends (infer U)[]
  ? DeepRequired<U>[]
  : T extends object
    ? { [K in keyof T]-?: DeepRequired<T[K]> }
    : T;
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
const sameShape: Same<
  DeepRequired<z.infer<typeof gatewayConfigSchema>>,
  DeepRequired<GatewayConfig>
> = true;
void sameShape;
