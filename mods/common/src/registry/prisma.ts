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
import { WriteBehind } from "../utils/WriteBehind";
import { MemoryRegistryStore } from "./stores";
import {
  AuditEntry,
  CatalogEntry,
  Lifecycle,
  Usage,
  UsageSource
} from "./types";

// Database-backed registry storage (add-provider-registry 2.1) over the apiserver's Prisma schema
// (registry_* tables and applications). The RegistryStore and UsageSource interfaces are
// synchronous, so these stores keep a snapshot in memory, write behind in order, and `flush()`
// waits for the writes (build log P-B1). Any Prisma client generated from the apiserver schema
// works, with or without the field-encryption extension.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PrismaLike = any;

const toState = (s: Lifecycle) => s.toUpperCase();
const fromState = (s: string) => s.toLowerCase() as Lifecycle;
const opt = <T>(v: T | null | undefined) => (v === null ? undefined : v);

/** Drops undefined keys so loaded entries equal the ones the registry wrote. */
function clean<T extends object>(o: T): T {
  return Object.fromEntries(
    Object.entries(o).filter(([, v]) => v !== undefined)
  ) as T;
}

export class PrismaRegistryStore extends MemoryRegistryStore {
  private readonly writes: WriteBehind;

  private constructor(private readonly prisma: PrismaLike) {
    super();
    this.writes = new WriteBehind();
  }

  /** Opens the store with the current catalog and audit log loaded. */
  static async open(prisma: PrismaLike): Promise<PrismaRegistryStore> {
    const store = new PrismaRegistryStore(prisma);
    await store.refresh();
    return store;
  }

  /** Reloads the catalog (and audit log) from the database, after pending writes. */
  async refresh() {
    await this.writes.flush();
    const [providers, models, voices, audit] = await Promise.all([
      this.prisma.registryProvider.findMany(),
      this.prisma.registryModel.findMany(),
      this.prisma.registryVoice.findMany({
        include: { models: { orderBy: { position: "asc" } } }
      }),
      this.prisma.registryAudit.findMany({ orderBy: { seq: "asc" } })
    ]);
    const entries = new Map<string, CatalogEntry>();
    for (const p of providers)
      entries.set(
        p.id,
        clean({
          kind: "provider",
          id: p.id,
          adapter: p.adapter,
          capabilities: p.capabilities,
          credentialRef: p.credentialRef,
          state: fromState(p.state),
          replacement: opt(p.replacement),
          retireOn: opt(p.retireOn)
        })
      );
    for (const m of models)
      entries.set(
        m.id,
        clean({
          kind: "model",
          id: m.id,
          type: m.type,
          features: m.features,
          languages: m.languages,
          settings: m.settings,
          state: fromState(m.state),
          replacement: opt(m.replacement),
          retireOn: opt(m.retireOn)
        })
      );
    for (const v of voices)
      entries.set(
        v.id,
        clean({
          kind: "voice",
          id: v.id,
          models: v.models.map((r: { modelId: string }) => r.modelId),
          language: opt(v.language),
          gender: opt(v.gender),
          ownerWorkspace: opt(v.ownerWorkspace),
          state: fromState(v.state),
          replacement: opt(v.replacement),
          retireOn: opt(v.retireOn)
        })
      );
    this.entries = entries;
    this.log = audit.map((a: Record<string, unknown>) =>
      clean({
        at: (a.at as Date).toISOString(),
        actor: a.actor as string,
        action: a.action as string,
        target: a.target as string,
        details: opt(a.details as Record<string, unknown> | null)
      })
    );
  }

  put(entry: CatalogEntry) {
    super.put(entry);
    const e = JSON.parse(JSON.stringify(entry)) as CatalogEntry;
    const common = {
      state: toState(e.state),
      replacement: e.replacement ?? null,
      retireOn: e.retireOn ?? null
    };
    const provider = e.id.split("/")[0];
    this.writes.push(async () => {
      if (e.kind === "provider") {
        const data = {
          adapter: e.adapter,
          capabilities: e.capabilities,
          credentialRef: e.credentialRef,
          ...common
        };
        await this.prisma.registryProvider.upsert({
          where: { id: e.id },
          create: { id: e.id, ...data },
          update: data
        });
      } else if (e.kind === "model") {
        const data = {
          providerId: provider,
          type: e.type,
          features: e.features,
          languages: e.languages,
          settings: e.settings,
          ...common
        };
        await this.prisma.registryModel.upsert({
          where: { id: e.id },
          create: { id: e.id, ...data },
          update: data
        });
      } else {
        const data = {
          providerId: provider,
          language: e.language ?? null,
          gender: e.gender ?? null,
          ownerWorkspace: e.ownerWorkspace ?? null,
          ...common
        };
        await this.prisma.$transaction([
          this.prisma.registryVoice.upsert({
            where: { id: e.id },
            create: { id: e.id, ...data },
            update: data
          }),
          this.prisma.registryVoiceModel.deleteMany({
            where: { voiceId: e.id }
          }),
          this.prisma.registryVoiceModel.createMany({
            data: e.models.map((modelId, position) => ({
              voiceId: e.id,
              modelId,
              position
            }))
          })
        ]);
      }
    });
  }

  audit(entry: AuditEntry) {
    super.audit(entry);
    this.writes.push(() =>
      this.prisma.registryAudit.create({
        data: {
          at: new Date(entry.at),
          actor: entry.actor,
          action: entry.action,
          target: entry.target,
          details: entry.details ?? undefined
        }
      })
    );
  }

  /** Waits for every queued write; throws the first failure. */
  flush() {
    return this.writes.flush();
  }
}

type SpeechRow = {
  ref: string;
  accessKeyId: string;
  name: string;
  speechVoice: string | null;
  speechSttModel: string | null;
  speechTtsModel: string | null;
  speechSettings: Record<string, unknown> | null;
  intelligence: { config: Record<string, unknown> } | null;
};

/** Which stored field a usage came from, so `rewrite` changes exactly that field. */
type Origin =
  | { kind: "app-tts"; row: SpeechRow }
  | { kind: "app-stt"; row: SpeechRow }
  | { kind: "assistant-llm"; row: SpeechRow; model: string }
  | { kind: "assistant-voice"; row: SpeechRow; voice: string };

export type RewriteConflict = { usage: Usage; reason: string };

export type PrismaUsageSourceOptions = {
  /** Receives every notice after it is stored (e.g. to send provider.deprecated webhooks). */
  onNotice?: (workspace: string, notice: Record<string, unknown>) => void;
};

/**
 * Usages of catalog ids in apps (speech defaults: voice, TTS and STT models) and assistants (the
 * Autopilot assistant in an app's Intelligence config: `languageModel.model`, and
 * `conversationSettings.voice`). Legacy rows with raw vendor names are not usages until migrated
 * to catalog ids (task 5.1).
 */
export class PrismaUsageSource implements UsageSource {
  private rows: SpeechRow[] = [];
  private readonly origins = new WeakMap<Usage, Origin>();
  private readonly writes = new WriteBehind();
  /** Rewrites skipped because the config changed after it was read. */
  readonly conflicts: RewriteConflict[] = [];

  private constructor(
    private readonly prisma: PrismaLike,
    private readonly options: PrismaUsageSourceOptions
  ) {}

  static async open(
    prisma: PrismaLike,
    options: PrismaUsageSourceOptions = {}
  ): Promise<PrismaUsageSource> {
    const source = new PrismaUsageSource(prisma, options);
    await source.refresh();
    return source;
  }

  async refresh() {
    await this.writes.flush();
    this.rows = await this.prisma.application.findMany({
      select: {
        ref: true,
        accessKeyId: true,
        name: true,
        speechVoice: true,
        speechSttModel: true,
        speechTtsModel: true,
        speechSettings: true,
        intelligence: { select: { config: true } }
      },
      orderBy: { ref: "asc" }
    });
  }

  find(id: string): Usage[] {
    const out: Usage[] = [];
    const add = (usage: Usage, origin: Origin) => {
      this.origins.set(usage, origin);
      out.push(usage);
    };
    for (const row of this.rows) {
      const app = { kind: "app" as const, ref: row.ref, name: row.name };
      if (row.speechVoice === id || row.speechTtsModel === id) {
        add(
          {
            workspace: row.accessKeyId,
            config: app,
            model: row.speechTtsModel ?? undefined,
            voice: row.speechVoice ?? undefined,
            settings: Object.keys(row.speechSettings ?? {}),
            requires: ["streaming"]
          },
          { kind: "app-tts", row }
        );
      }
      if (row.speechSttModel === id) {
        add(
          {
            workspace: row.accessKeyId,
            config: app,
            model: id,
            settings: [],
            requires: ["streaming"]
          },
          { kind: "app-stt", row }
        );
      }
      const assistant = row.intelligence?.config as
        | {
            languageModel?: { model?: string; tools?: unknown[] };
            conversationSettings?: { voice?: string };
          }
        | undefined;
      const llm = assistant?.languageModel?.model;
      const config = {
        kind: "assistant" as const,
        ref: row.ref,
        name: row.name
      };
      if (llm === id) {
        add(
          {
            workspace: row.accessKeyId,
            config,
            model: llm,
            settings: [],
            requires: assistant?.languageModel?.tools?.length
              ? ["streaming", "tool-calling"]
              : ["streaming"]
          },
          { kind: "assistant-llm", row, model: llm }
        );
      }
      const voice = assistant?.conversationSettings?.voice;
      if (voice === id) {
        add(
          {
            workspace: row.accessKeyId,
            config,
            model: row.speechTtsModel ?? undefined,
            voice,
            settings: [],
            requires: ["streaming"]
          },
          { kind: "assistant-voice", row, voice }
        );
      }
    }
    return out;
  }

  /**
   * Queues the rewrite. The write only applies if the field still holds the value read; otherwise
   * it is skipped, audited by the caller's flush report (`conflicts`), and the config keeps its id.
   */
  rewrite(
    usage: Usage,
    change: { model?: string; voice?: string; dropSettings: string[] }
  ): boolean {
    const origin = this.origins.get(usage);
    if (!origin) return false;
    const row = origin.row;
    const conflict = (reason: string) => this.conflicts.push({ usage, reason });
    if (origin.kind === "app-tts" || origin.kind === "app-stt") {
      const where: Record<string, unknown> = { ref: row.ref };
      const data: Record<string, unknown> = { updatedAt: new Date() };
      if (origin.kind === "app-stt") {
        where.speechSttModel = row.speechSttModel;
        if (change.model) data.speechSttModel = change.model;
      } else {
        where.speechVoice = row.speechVoice;
        where.speechTtsModel = row.speechTtsModel;
        if (change.model) data.speechTtsModel = change.model;
        if (change.voice) data.speechVoice = change.voice;
        if (change.dropSettings.length && row.speechSettings) {
          data.speechSettings = Object.fromEntries(
            Object.entries(row.speechSettings).filter(
              ([k]) => !change.dropSettings.includes(k)
            )
          );
        }
      }
      this.writes.push(async () => {
        const { count } = await this.prisma.application.updateMany({
          where,
          data
        });
        if (count === 0) conflict("app changed since it was read");
      });
      return true;
    }
    const config = JSON.parse(
      JSON.stringify(row.intelligence?.config ?? {})
    ) as {
      languageModel?: { model?: string };
      conversationSettings?: { voice?: string };
    };
    let path: string[];
    let expected: string;
    if (origin.kind === "assistant-llm") {
      path = ["languageModel", "model"];
      expected = origin.model;
      if (change.model) config.languageModel!.model = change.model;
    } else {
      path = ["conversationSettings", "voice"];
      expected = origin.voice;
      if (change.voice) config.conversationSettings!.voice = change.voice;
    }
    this.writes.push(async () => {
      const { count } = await this.prisma.intelligence.updateMany({
        where: { applicationRef: row.ref, config: { path, equals: expected } },
        data: { config }
      });
      if (count === 0) conflict("assistant changed since it was read");
      else
        await this.prisma.application.update({
          where: { ref: row.ref },
          data: { updatedAt: new Date() }
        });
    });
    return true;
  }

  notify(workspace: string, notice: Record<string, unknown>) {
    this.writes.push(async () => {
      await this.prisma.registryNotice.create({
        data: {
          accessKeyId: workspace,
          type: String(notice.type),
          data: notice
        }
      });
      this.options.onNotice?.(workspace, notice);
    });
  }

  /** Waits for every queued write; throws the first failure. */
  flush() {
    return this.writes.flush();
  }
}

export type PrismaClientOptions = {
  url: string;
  /** Encrypts `/// @encrypted` columns (the apiserver's CLOAK key); needed to read app secrets. */
  encryptionKey?: string;
  /** Module of a client generated from the apiserver schema (default `@prisma/client`). */
  clientModule?: string;
};

/**
 * Opens a Prisma client generated from the apiserver's schema, with field encryption when a key
 * is given. Loaded at run time so `@fonoster/common` does not depend on a generated client.
 */
export function openPrismaClient(options: PrismaClientOptions): PrismaLike {
  /* eslint-disable @typescript-eslint/no-var-requires */
  const { PrismaClient, Prisma } = require(
    options.clientModule ??
      process.env.FONOSTER_PRISMA_CLIENT ??
      "@prisma/client"
  );
  const client = new PrismaClient({ datasourceUrl: options.url });
  if (!options.encryptionKey) return client;
  const { fieldEncryptionExtension } = require("prisma-field-encryption");
  /* eslint-enable @typescript-eslint/no-var-requires */
  return client.$extends(
    fieldEncryptionExtension({
      encryptionKey: options.encryptionKey,
      dmmf: Prisma?.dmmf
    })
  );
}
