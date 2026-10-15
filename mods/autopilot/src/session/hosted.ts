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
    /**
     * Private destinations HTTP tools may call (host names, IPs, CIDRs; RV-B2); defaults to
     * FONOSTER_ALLOWED_DESTINATIONS.
     */
    allowedDestinations: z.array(z.string()).optional(),
    /** The secret the gateway signs Autopilot sessions with (one for every Autopilot app). */
    signingSecret: secretRef,
    /**
     * Apps and their assistants: a file `{apps: {<appRef>: {workspaceRef?, assistant}}}` (JSON or
     * YAML), or `database`: the apps' Intelligence rows, cached for `cacheMs` (CP-B11).
     */
    assistants: z.union([
      z.object({ file: z.string() }).strict(),
      z
        .object({
          source: z.literal("database"),
          cacheMs: z.number().int().nonnegative().default(5000)
        })
        .strict()
    ]),
    /** The provider registry's catalog: the JSON file fonoster-registry writes, or the tables. */
    registry: z.union([
      z.object({ file: z.string() }).strict(),
      z
        .object({
          source: z.literal("database"),
          refreshMs: z.number().int().positive().default(30000)
        })
        .strict()
    ]),
    /** Platform keys by credentialRef. */
    credentials: z.record(secretRef).default({}),
    /**
     * Workspace Secrets (bring your own key): a JSON file by workspace and credentialRef, or
     * `database`: the workspace's vendor keys (workspace_provider_keys).
     */
    workspaceSecrets: z
      .union([
        z.object({ file: z.string() }).strict(),
        z.object({ source: z.literal("database") }).strict()
      ])
      .optional(),
    /** The control-plane database (the apiserver's), for any `source: database`. */
    database: z
      .object({
        url: z.string().optional(),
        urlEnv: z.string().default("APISERVER_DATABASE_URL"),
        /** The apiserver's encryption key (vendor keys are encrypted Secrets). */
        encryptionKeyEnv: z.string().optional(),
        /** A client generated from the apiserver schema (default `@prisma/client`). */
        clientModule: z.string().optional()
      })
      .strict()
      .optional(),
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
  const withFile = <T extends object>(c: T): T =>
    "file" in c ? ({ ...c, file: rel(c.file as string) } as T) : c;
  const needsDb =
    !("file" in config.assistants) ||
    !("file" in config.registry) ||
    (config.workspaceSecrets && !("file" in config.workspaceSecrets));
  if (needsDb && !config.database)
    throw new Error("source: database needs a database section");
  return {
    ...config,
    assistants: withFile(config.assistants),
    registry: withFile(config.registry),
    ...(config.workspaceSecrets
      ? { workspaceSecrets: withFile(config.workspaceSecrets) }
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

type AssistantRow = {
  ref: string;
  accessKeyId: string;
  type: string;
  intelligence?: { config: unknown } | null;
};

/**
 * Assistants from the control plane: an Autopilot app's Intelligence row holds its assistant
 * (CP-B3). Each app is cached for `cacheMs` (misses too), so edits show up within seconds.
 */
export class PrismaAssistantSource {
  private cache = new Map<string, { at: number; value?: LoadedAssistant }>();

  constructor(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly prisma: any,
    private readonly options: { cacheMs?: number; now?: () => number } = {}
  ) {}

  async get(appRef: string): Promise<LoadedAssistant | undefined> {
    const now = this.options.now?.() ?? Date.now();
    const hit = this.cache.get(appRef);
    if (hit && now - hit.at < (this.options.cacheMs ?? 5000)) return hit.value;
    const row: AssistantRow | null = await this.prisma.application.findUnique({
      where: { ref: appRef },
      include: { intelligence: true }
    });
    const value =
      row && row.type === "AUTOPILOT" && row.intelligence?.config
        ? { assistant: row.intelligence.config, workspaceRef: row.accessKeyId }
        : undefined;
    this.cache.set(appRef, { at: now, value });
    return value;
  }
}

/** Workspace vendor keys from the database, looked up by the credentialRef's providers. */
export class DatabaseWorkspaceSecrets implements CredentialSource {
  constructor(
    private readonly keys: Registry.PrismaWorkspaceKeys,
    private readonly providers: () => { id: string; credentialRef: string }[]
  ) {}

  get(ref: string, scope: { workspaceRef?: string }) {
    if (!scope.workspaceRef) return undefined;
    return this.keys.forCredentialRef(
      scope.workspaceRef,
      ref,
      this.providers()
    );
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

/** Opens the control-plane database named in the config (once). */
function databaseOf(config: HostedConfig) {
  const d = config.database!;
  const url = d.url ?? process.env[d.urlEnv];
  if (!url) throw new Error(`database: set url or ${d.urlEnv}`);
  return Registry.openPrismaClient({
    url,
    encryptionKey: d.encryptionKeyEnv
      ? process.env[d.encryptionKeyEnv]
      : undefined,
    clientModule: d.clientModule
  });
}

/** The registry store: the file, or the tables refreshed every `refreshMs`. */
function registryStore(
  config: HostedConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: () => any
): Registry.MemoryRegistryStore {
  if ("file" in config.registry)
    return new Registry.FileRegistryStore(config.registry.file);
  const store = new Registry.MemoryRegistryStore();
  const every = (config.registry as { refreshMs?: number }).refreshMs ?? 30000;
  const load = () =>
    Registry.PrismaRegistryStore.open(db())
      .then((loaded) => {
        for (const e of loaded.all()) store.put(e);
      })
      .catch((e: Error) =>
        logger.warn(`registry refresh failed, keeping the last: ${e.message}`)
      );
  void load();
  setInterval(load, every).unref();
  return store;
}

/** The handler options the hosted Autopilot runs with, built from its config. */
export function hostedOptions(
  config: HostedConfig,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: { prisma?: any } = {}
): AutopilotOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let prisma: any = deps.prisma;
  const db = () => (prisma ??= databaseOf(config));
  const store = registryStore(config, db);
  const registry = new Registry.Registry({
    store,
    testMode: config.testMode
  });
  const providers = () =>
    store
      .all()
      .filter((e) => e.kind === "provider")
      .map((e) => ({
        id: e.id,
        credentialRef: (e as { credentialRef: string }).credentialRef
      }));
  const workspace = config.workspaceSecrets;
  const credentials = new LayeredCredentials([
    ...(workspace
      ? [
          "file" in workspace
            ? new FileWorkspaceSecrets(workspace.file)
            : new DatabaseWorkspaceSecrets(
                new Registry.PrismaWorkspaceKeys(db()),
                providers
              )
        ]
      : []),
    new ConfigCredentials(config.credentials)
  ]);
  const assistants =
    "file" in config.assistants
      ? new FileAssistantSource(config.assistants.file)
      : new PrismaAssistantSource(db(), {
          cacheMs: (config.assistants as { cacheMs?: number }).cacheMs
        });
  const knowledge = config.knowledge
    ? s3Knowledge(config.knowledge, credentials)
    : undefined;
  return {
    load: (session) => assistants.get(session.appRef),
    allowedDestinations: config.allowedDestinations,
    llm: new RegistryLlmResolver({
      registry,
      credentials,
      endpoints: config.endpoints
    }),
    knowledgeFor: knowledge ? eagerKnowledge(knowledge) : undefined
  };
}

/**
 * One knowledge port per call, built eagerly; a lookup waits for it (and gives up after 800 ms
 * like any). A port that fails to build is logged and answers nothing: the eager promise always
 * has a handler, so a failure never becomes an unhandled rejection (RV-B5).
 */
export function eagerKnowledge(
  build: (
    assistant: SessionAssistant,
    scope: { workspaceRef?: string }
  ) => Promise<KnowledgePort | undefined>
) {
  return (
    assistant: SessionAssistant,
    scope: { workspaceRef?: string }
  ): KnowledgePort => {
    const port = Promise.resolve()
      .then(() => build(assistant, scope))
      .catch((e: Error) => {
        logger.warn(`knowledge port unavailable: ${e?.message ?? e}`);
        return undefined;
      });
    return {
      find: async (question, signal) => {
        const p = await port;
        return p ? p.find(question, signal) : "";
      }
    };
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
