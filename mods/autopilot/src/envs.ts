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
    recordings: z
      .object({
        baseUrl: z.string().default("http://localhost:9876/api/recordings")
      })
      .default({}),
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

const config: AutopilotConfig = loadServiceConfig({
  service: "autopilot",
  schema: autopilotConfigSchema,
  movedKeys: MOVED_KEYS,
  legacyEnvPrefixes: ["AUTOPILOT_"]
});

const [bind, port] = config.server.bindAddr.split(":");

export { autopilotConfigSchema, MOVED_KEYS };
export type { AutopilotConfig };

export const LOGS = config.logs;
export const NODE_ENV = process.env.NODE_ENV || "production";
export const VOICE_SERVER_BIND = bind || "0.0.0.0";
export const VOICE_SERVER_PORT = Number(port || 50061);
export const IDENTITY_ADDRESS = config.server.identityAddress;
export const CONVERSATION_PROVIDER = config.conversation.provider;
export const CONVERSATION_PROVIDER_FILE = config.conversation.file;
export const APISERVER_ENDPOINT = config.apiserver.endpoint;
export const INTEGRATIONS_FILE = config.integrationsFile;
export const OPENAI_API_KEY = config.knowledgeBase.embeddings.openaiApiKey;
export const RECORDING_BASE_URL = config.recordings.baseUrl;
export const SKIP_IDENTITY = config.dev.skipIdentity;
export const KNOWLEDGE_BASE_ENABLED = config.knowledgeBase.enabled;
export const AWS_S3_ACCESS_KEY_ID = config.knowledgeBase.s3.accessKeyId;
export const AWS_S3_SECRET_ACCESS_KEY = config.knowledgeBase.s3.secretAccessKey;
export const AWS_S3_REGION = config.knowledgeBase.s3.region;
export const AWS_S3_ENDPOINT = config.knowledgeBase.s3.endpoint;
export const UNSTRUCTURED_API_KEY = config.knowledgeBase.unstructured.apiKey;
export const UNSTRUCTURED_API_URL = config.knowledgeBase.unstructured.url;
