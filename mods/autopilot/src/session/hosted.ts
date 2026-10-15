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
import * as path from "path";
import { Registry } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { VoiceServer } from "@fonoster/voice";
import * as yaml from "js-yaml";
import { z } from "zod";
import { SessionAssistant } from "./config";
import {
  AutopilotOptions,
  createAutopilotHandler,
  LoadedAssistant
} from "./createAutopilot";
import { fromKnowledgeBase, KnowledgePort } from "./knowledge";
import {
  ConfigCredentials,
  CredentialSource,
  LayeredCredentials,
  RegistryLlmResolver
} from "./llm";

// The hosted Autopilot (rework-autopilot A2, task 4.3): an ordinary VoiceServer that the gateway
// dials like any app. Everything it needs comes from one operator config file; no vendor key is
// read from Autopilot's environment by name (A8, A11), only through credential refs.

const logger = getLogger({ service: "autopilot", filePath: __filename });

const secretRef = z.union([
  z.object({ env: z.string() }).strict(),
  z.object({ value: z.string() }).strict()
]);

export const hostedConfigSchema = z
  .object({
    host: z.string().default("0.0.0.0"),
    port: z.number().int().nonnegative().default(50061),
    /** The secret the gateway signs Autopilot sessions with (one for every Autopilot app). */
    signingSecret: secretRef,
    /** Apps and their assistants: `{apps: {<appRef>: {workspaceRef?, assistant}}}` (JSON or YAML). */
    assistants: z.object({ file: z.string() }).strict(),
    /** The provider registry's catalog (the JSON file fonoster-registry writes). */
    registry: z.object({ file: z.string() }).strict(),
    /** Platform keys by credentialRef. */
    credentials: z.record(secretRef).default({}),
    /** Workspace Secrets (bring your own key) by workspace and credentialRef, JSON. */
    workspaceSecrets: z.object({ file: z.string() }).strict().optional(),
    /** Endpoint overrides by adapter or provider id (e.g. a local ollama, the fake LLM). */
    endpoints: z.record(z.string()).default({}),
    /** The S3 + Unstructured knowledge bases; keys by credentialRef (task 4.1). */
    knowledge: z
      .object({
        s3: z.object({
          endpoint: z.string(),
          region: z.string().default("us-east-1"),
          accessKeyIdRef: z.string(),
          secretAccessKeyRef: z.string()
        }),
        unstructured: z.object({ url: z.string(), apiKeyRef: z.string() }),
        embeddings: z.object({ apiKeyRef: z.string() })
      })
      .optional(),
    testMode: z.boolean().default(false)
  })
  .strict();

export type HostedConfig = z.infer<typeof hostedConfigSchema>;

function readStructured(file: string): unknown {
  const text = fs.readFileSync(file, "utf8");
  return /\.ya?ml$/.test(file) ? yaml.load(text) : JSON.parse(text);
}

export function loadHostedConfig(file: string): HostedConfig {
  const config = hostedConfigSchema.parse(readStructured(file));
  const dir = path.dirname(file);
  const rel = (p: string) => (path.isAbsolute(p) ? p : path.join(dir, p));
  return {
    ...config,
    assistants: { file: rel(config.assistants.file) },
    registry: { file: rel(config.registry.file) },
    ...(config.workspaceSecrets
      ? { workspaceSecrets: { file: rel(config.workspaceSecrets.file) } }
      : {})
  };
}

const resolveSecret = (s: { env?: string; value?: string }) =>
  "value" in s && s.value !== undefined ? s.value : process.env[s.env ?? ""];

/** Apps and assistants from a file (a stand-in until assistants come from the control plane). */
export class FileAssistantSource {
  constructor(private readonly file: string) {}

  async get(appRef: string): Promise<LoadedAssistant | undefined> {
    const data = readStructured(this.file) as {
      apps?: Record<string, { workspaceRef?: string; assistant: unknown }>;
    };
    const app = data.apps?.[appRef];
    return app
      ? { assistant: app.assistant, workspaceRef: app.workspaceRef }
      : undefined;
  }
}

/** Workspace Secrets from a JSON file: `{<workspaceRef>: {<credentialRef>: value}}`. */
export class FileWorkspaceSecrets implements CredentialSource {
  constructor(private readonly file: string) {}

  get(ref: string, scope: { workspaceRef?: string }) {
    if (!scope.workspaceRef) return undefined;
    const data = readStructured(this.file) as Record<
      string,
      Record<string, string>
    >;
    return data[scope.workspaceRef]?.[ref];
  }
}

type KnowledgeBaseLike = {
  load(): Promise<void>;
  queryKnowledgeBase(query: string, k?: number): Promise<string>;
};

/**
 * Builds the knowledge port for an assistant from the operator's S3 + Unstructured settings,
 * with keys from the credential source (never Autopilot's environment). The bucket is the
 * workspace's, as today. `make` is the knowledge base constructor (the S3 one by default).
 */
export function s3Knowledge(
  config: NonNullable<HostedConfig["knowledge"]>,
  credentials: CredentialSource,
  make?: (params: Record<string, unknown>) => KnowledgeBaseLike
) {
  return async (
    assistant: SessionAssistant,
    scope: { workspaceRef?: string }
  ): Promise<KnowledgePort | undefined> => {
    const documents = assistant.languageModel.knowledgeBase.map(
      (d) => d.document
    );
    if (!documents.length || !scope.workspaceRef) return undefined;
    const key = (ref: string) => credentials.get(ref, scope);
    const [accessKeyId, secretAccessKey, unstructuredKey, embeddingsKey] =
      await Promise.all([
        key(config.s3.accessKeyIdRef),
        key(config.s3.secretAccessKeyRef),
        key(config.unstructured.apiKeyRef),
        key(config.embeddings.apiKeyRef)
      ]);
    const params = {
      bucket: scope.workspaceRef.toLowerCase(),
      documents,
      s3Config: {
        endpoint: config.s3.endpoint,
        region: config.s3.region,
        credentials: {
          accessKeyId: accessKeyId ?? "",
          secretAccessKey: secretAccessKey ?? ""
        },
        forcePathStyle: true
      },
      unstructuredAPIURL: config.unstructured.url,
      unstructuredAPIKey: unstructuredKey ?? "",
      embeddingsApiKey: embeddingsKey ?? ""
    };
    const kb = (make ?? defaultKnowledgeBase)(params);
    kb.load().catch((e: Error) =>
      logger.warn(`knowledge base did not load: ${e.message}`)
    );
    return fromKnowledgeBase(kb);
  };
}

function defaultKnowledgeBase(params: Record<string, unknown>) {
  // Loaded lazily: the S3 loader and embeddings pull in LangChain, which only the knowledge
  // port still uses.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { S3KnowledgeBase } = require("../knowledge/S3KnowledgeBase");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { OpenAIEmbeddings } = require("@langchain/openai");
  return new S3KnowledgeBase({
    ...params,
    embeddings: new OpenAIEmbeddings({ apiKey: params.embeddingsApiKey })
  }) as KnowledgeBaseLike;
}

/** The handler options the hosted Autopilot runs with, built from its config. */
export function hostedOptions(config: HostedConfig): AutopilotOptions {
  const registry = new Registry.Registry({
    store: new Registry.FileRegistryStore(config.registry.file),
    testMode: config.testMode
  });
  const credentials = new LayeredCredentials([
    ...(config.workspaceSecrets
      ? [new FileWorkspaceSecrets(config.workspaceSecrets.file)]
      : []),
    new ConfigCredentials(config.credentials)
  ]);
  const assistants = new FileAssistantSource(config.assistants.file);
  const knowledge = config.knowledge
    ? s3Knowledge(config.knowledge, credentials)
    : undefined;
  return {
    load: (session) => assistants.get(session.appRef),
    llm: new RegistryLlmResolver({
      registry,
      credentials,
      endpoints: config.endpoints
    }),
    knowledgeFor: knowledge
      ? (assistant, scope) => {
          // One port per call; a lookup waits for it (and gives up after 800 ms like any).
          const port = knowledge(assistant, scope);
          return {
            find: async (question, signal) => {
              const p = await port;
              return p ? p.find(question, signal) : "";
            }
          };
        }
      : undefined
  };
}

/** Starts the hosted Autopilot. */
export async function startHostedAutopilot(config: HostedConfig) {
  const secret = resolveSecret(config.signingSecret);
  if (!secret) throw new Error("signingSecret resolves to nothing");
  const server = await new VoiceServer({
    host: config.host,
    port: config.port,
    signingSecret: secret
  }).listen(createAutopilotHandler(hostedOptions(config)));
  logger.info(`hosted autopilot listening on ${config.host}:${server.port}`);
  return server;
}
