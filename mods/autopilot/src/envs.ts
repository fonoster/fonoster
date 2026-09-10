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
import { loadServiceConfig } from "@fonoster/common";
import { z } from "zod";
import { ConversationProvider } from "./types";

/**
 * Autopilot is configured from `config/autopilot.yaml` (path overridable with
 * `--config <path>` or the `FONOSTER_CONFIG` env var). Only secrets need to come
 * from the environment, via `${VAR}` references in that file.
 */
const autopilotConfigSchema = z
  .object({
    conversation: z
      .object({
        provider: z
          .nativeEnum(ConversationProvider)
          .default(ConversationProvider.FILE),
        file: z.string().default(`${process.cwd()}/config/assistant.json`)
      })
      .default({}),
    apiserverEndpoint: z.string().default("apiserver:50051"),
    integrationsFile: z.string().default("/opt/fonoster/integrations.json"),
    openaiApiKey: z.string().optional(),
    recording: z
      .object({
        baseUrl: z.string().default("http://localhost:9876/api/recordings")
      })
      .default({}),
    skipIdentity: z.boolean().default(false),
    knowledgeBase: z
      .object({
        enabled: z.boolean().default(false),
        s3: z
          .object({
            accessKeyId: z.string().default(""),
            secretAccessKey: z.string().default(""),
            region: z.string().default("us-east-1"),
            endpoint: z.string().default("")
          })
          .default({}),
        unstructured: z
          .object({
            apiKey: z.string().default(""),
            apiUrl: z
              .string()
              .default("https://api.unstructuredapp.io/general/v0/general")
          })
          .default({})
      })
      .default({})
  })
  .superRefine((cfg, ctx) => {
    const kb = cfg.knowledgeBase;
    if (!kb.enabled) return;

    const require = (value: string, path: string[]) => {
      if (!value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["knowledgeBase", ...path],
          message: "required when knowledgeBase.enabled is true"
        });
      }
    };

    require(kb.s3.accessKeyId, ["s3", "accessKeyId"]);
    require(kb.s3.secretAccessKey, ["s3", "secretAccessKey"]);
    require(kb.unstructured.apiKey, ["unstructured", "apiKey"]);

    if (!kb.s3.endpoint && !kb.s3.region) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["knowledgeBase", "s3"],
        message: "either s3.endpoint or s3.region must be set"
      });
    }
  });

type AutopilotConfig = z.infer<typeof autopilotConfigSchema>;

const config: AutopilotConfig = loadServiceConfig({
  service: "autopilot",
  schema: autopilotConfigSchema
});

export { autopilotConfigSchema };
export type { AutopilotConfig };

export const NODE_ENV = process.env.NODE_ENV || "production";
export const CONVERSATION_PROVIDER = config.conversation.provider;
export const CONVERSATION_PROVIDER_FILE = config.conversation.file;
export const APISERVER_ENDPOINT = config.apiserverEndpoint;
export const INTEGRATIONS_FILE = config.integrationsFile;
export const OPENAI_API_KEY = config.openaiApiKey;
export const RECORDING_BASE_URL = config.recording.baseUrl;
export const SKIP_IDENTITY = config.skipIdentity;
export const KNOWLEDGE_BASE_ENABLED = config.knowledgeBase.enabled;
export const AWS_S3_ACCESS_KEY_ID = config.knowledgeBase.s3.accessKeyId;
export const AWS_S3_SECRET_ACCESS_KEY = config.knowledgeBase.s3.secretAccessKey;
export const AWS_S3_REGION = config.knowledgeBase.s3.region;
export const AWS_S3_ENDPOINT = config.knowledgeBase.s3.endpoint || undefined;
export const UNSTRUCTURED_API_KEY = config.knowledgeBase.unstructured.apiKey;
export const UNSTRUCTURED_API_URL = config.knowledgeBase.unstructured.apiUrl;
