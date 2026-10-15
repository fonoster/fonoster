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
import { loadServiceConfig, logsSchema } from "@fonoster/common";
import { z } from "zod";
import { ConversationProvider } from "./types";

/**
 * Autopilot reads autopilot.yaml (or .jsonc), found via --config,
 * /opt/fonoster or ./config. One file serves every replica. Everything,
 * secrets included, is in the file: Autopilot reads no environment variables
 * of its own.
 */
const autopilotConfigSchema = z
  .object({
    server: z
      .object({
        bindAddr: z.string().default("0.0.0.0:50061"),
        /** Where the voice server fetches the public key that verifies call tokens (TLS). */
        identityAddress: z.string().default("api.fonoster.com")
      })
      .default({}),
    apiserver: z
      .object({
        /** Loads assistants and reports conversations. */
        endpoint: z.string().default("apiserver:50051")
      })
      .default({}),
    logs: logsSchema,
    conversation: z
      .object({
        provider: z
          .nativeEnum(ConversationProvider)
          .default(ConversationProvider.FILE),
        /** Used when provider is file. */
        file: z.string().default(`${process.cwd()}/config/assistant.json`)
      })
      .default({}),
    /** Speech provider credentials; the same file the API server mounts. */
    integrationsFile: z.string().default("/opt/fonoster/integrations.json"),
    knowledgeBase: z
      .object({
        enabled: z.boolean().default(false),
        s3: z
          .object({
            /** Leave out for AWS; set for MinIO or other S3-compatible storage. */
            endpoint: z.string().optional(),
            region: z.string().default("us-east-1"),
            accessKeyId: z.string().default(""),
            secretAccessKey: z.string().default("")
          })
          .default({}),
        unstructured: z
          .object({
            url: z
              .string()
              .default("https://api.unstructuredapp.io/general/v0/general"),
            apiKey: z.string().default("")
          })
          .default({}),
        embeddings: z
          .object({ openaiApiKey: z.string().optional() })
          .default({})
      })
      .default({}),
    /**
     * Unused: the API server's /api/recordings bridge was removed (recordings are part of the
     * call record). Accepted so older files still load; it has no default.
     */
    recordings: z.object({ baseUrl: z.string().optional() }).optional(),
    dev: z.object({ skipIdentity: z.boolean().default(false) }).default({})
  })
  .superRefine((cfg, ctx) => {
    const kb = cfg.knowledgeBase;
    if (!kb.enabled) return;

    const required = (value: string | undefined, path: string[]) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["knowledgeBase", ...path],
          message: "required when knowledgeBase.enabled is true"
        });
      }
    };

    required(kb.s3.accessKeyId, ["s3", "accessKeyId"]);
    required(kb.s3.secretAccessKey, ["s3", "secretAccessKey"]);
    required(kb.unstructured.apiKey, ["unstructured", "apiKey"]);
    required(kb.embeddings.openaiApiKey, ["embeddings", "openaiApiKey"]);
  });

type AutopilotConfig = z.infer<typeof autopilotConfigSchema>;

/** Keys from the first autopilot.yaml draft (the `next` branch). */
const MOVED_KEYS = {
  apiserverEndpoint: "apiserver.endpoint",
  recording: "recordings",
  skipIdentity: "dev.skipIdentity",
  openaiApiKey: "knowledgeBase.embeddings.openaiApiKey",
  "knowledgeBase.unstructured.apiUrl": "knowledgeBase.unstructured.url"
};

let config: AutopilotConfig | undefined;

/**
 * Autopilot's config (autopilot.yaml), loaded and validated on first use.
 * Loading is deferred so other services can import this package as a library
 * (the API server does) without reading Autopilot's config file.
 */
function getConfig(): AutopilotConfig {
  config ??= loadServiceConfig({
    service: "autopilot",
    schema: autopilotConfigSchema,
    movedKeys: MOVED_KEYS,
    legacyEnvPrefixes: ["AUTOPILOT_"]
  });
  return config;
}

/** host and port of `server.bindAddr`. */
function getVoiceServerAddress() {
  const [bind, port] = getConfig().server.bindAddr.split(":");
  return { bind: bind || "0.0.0.0", port: Number(port || 50061) };
}

const NODE_ENV = process.env.NODE_ENV || "production";

export {
  autopilotConfigSchema,
  getConfig,
  getVoiceServerAddress,
  MOVED_KEYS,
  NODE_ENV
};
export type { AutopilotConfig };
