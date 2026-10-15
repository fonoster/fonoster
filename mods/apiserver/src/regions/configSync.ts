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
import { getLogger } from "@fonoster/logger";
import { LinkPublisher, RegionService } from "./service";
import { RegionRow, RegionsDb, subjects } from "./types";

const logger = getLogger({ service: "apiserver", filePath: __filename });

/** What a private cell runs on (PR-7); central config is authoritative. */
export type ConfigKinds = {
  numbers: unknown[];
  apps: Record<string, unknown>[];
  assistants: { appRef: string; productRef?: string; config: unknown }[];
  routr: {
    domains: unknown[];
    agents: unknown[];
    trunks: unknown[];
    acls: unknown[];
  };
  catalog: Record<string, unknown>[];
  webhooks: unknown[];
  recordingPolicy: Record<string, unknown>;
};

/** Where a snapshot's parts come from (Prisma and the Routr-backed services in production). */
export type SnapshotSources = {
  apps(accessKeyId: string): Promise<{
    apps: Record<string, unknown>[];
    assistants: ConfigKinds["assistants"];
  }>;
  numbers(accessKeyId: string): Promise<unknown[]>;
  routr(accessKeyId: string): Promise<ConfigKinds["routr"]>;
  /** Catalog entries (providers, models, voices) for the given catalog ids and providers. */
  catalog(
    ids: string[],
    providers: string[]
  ): Promise<Record<string, unknown>[]>;
  webhooks(accessKeyId: string): Promise<unknown[]>;
  recordingPolicy(accessKeyId: string): Promise<Record<string, unknown>>;
};

/** The gateway's defaults when an app names no voice or STT model. */
export const DEFAULT_SPEECH = {
  voice: "deepgram/aura-2-thalia-en",
  sttModel: "deepgram/nova-3"
};

const providerOf = (catalogId?: unknown) =>
  typeof catalogId === "string" && catalogId.includes("/")
    ? catalogId.split("/")[0]
    : undefined;

/**
 * The catalog ids each app and assistant uses, and the secret names (provider ids) they need,
 * with who needs them (PR-4: names only, never values).
 */
export function catalogUse(
  apps: Record<string, unknown>[],
  assistants: ConfigKinds["assistants"]
) {
  const ids = new Set<string>();
  const usedBy = new Map<string, Set<string>>();
  const use = (id: string | undefined, by: string) => {
    if (!id) return;
    ids.add(id);
    const provider = providerOf(id);
    if (!provider) return;
    if (!usedBy.has(provider)) usedBy.set(provider, new Set());
    usedBy.get(provider)!.add(by);
  };
  for (const app of apps) {
    const name = String(app.name ?? app.ref);
    use((app.speechVoice as string) || DEFAULT_SPEECH.voice, name);
    use((app.speechSttModel as string) || DEFAULT_SPEECH.sttModel, name);
    if (app.speechTtsModel) use(app.speechTtsModel as string, name);
  }
  for (const a of assistants) {
    const app = apps.find((x) => x.ref === a.appRef);
    const name = String(app?.name ?? a.appRef);
    const config = (a.config ?? {}) as Record<string, unknown>;
    const lm = config.languageModel as { model?: string } | undefined;
    if (lm?.model) use(lm.model, name);
    else if (a.productRef?.startsWith("llm."))
      use(`${a.productRef.slice(4)}/default`, name);
  }
  const secrets = [...usedBy.entries()]
    .map(([name, by]) => ({ name, usedBy: [...by].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return { ids: [...ids].sort(), secrets };
}

export type ConfigMessage = {
  type: "region.config";
  configVersion: number;
  full: true;
  kinds: ConfigKinds;
};

/**
 * Config sync to private cells (task 2.4): full snapshots with an increasing configVersion,
 * published on change (debounced) and on request; paused while the region is `unsupported`.
 */
export function createConfigSync(deps: {
  db: RegionsDb;
  service: RegionService;
  sources: SnapshotSources;
  publish: LinkPublisher;
  debounceMs?: number;
}) {
  const { db, service, sources, publish } = deps;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();

  const snapshot = async (accessKeyId: string): Promise<ConfigKinds> => {
    const [{ apps, assistants }, numbers, routr, webhooks, recordingPolicy] =
      await Promise.all([
        sources.apps(accessKeyId),
        sources.numbers(accessKeyId),
        sources.routr(accessKeyId),
        sources.webhooks(accessKeyId),
        sources.recordingPolicy(accessKeyId)
      ]);
    const use = catalogUse(apps, assistants);
    const catalog = await sources.catalog(
      use.ids,
      use.secrets.map((s) => s.name)
    );
    return {
      numbers,
      apps,
      assistants,
      routr,
      catalog,
      webhooks,
      recordingPolicy
    };
  };

  const secretsNeeded = async (accessKeyId: string) => {
    const { apps, assistants } = await sources.apps(accessKeyId);
    return catalogUse(apps, assistants).secrets;
  };

  const paused = (row: RegionRow) =>
    service.statusOf(row).status === "unsupported";

  /** Builds and publishes a new version; returns it, or undefined when paused or not enrolled. */
  const publishNow = async (row: RegionRow) => {
    if (row.state !== "enrolled" || paused(row)) return undefined;
    const kinds = await snapshot(row.accessKeyId);
    const updated: RegionRow = await db.region.update({
      where: { ref: row.ref },
      data: { configVersion: { increment: 1 } }
    });
    const message: ConfigMessage = {
      type: "region.config",
      configVersion: updated.configVersion,
      full: true,
      kinds
    };
    publish(subjects(row.ref).config, message);
    const names = catalogUse(kinds.apps, kinds.assistants).secrets.map(
      (s) => s.name
    );
    publish(subjects(row.ref).secretsNeeded, {
      type: "region.secrets.needed",
      names
    });
    return message;
  };

  return {
    snapshot,
    secretsNeeded,
    publishNow,

    /** A workspace's config changed: publish soon (several changes make one version). */
    onChange(accessKeyId: string) {
      clearTimeout(timers.get(accessKeyId));
      const timer = setTimeout(() => {
        timers.delete(accessKeyId);
        void service
          .byWorkspace(accessKeyId)
          .then((row) => (row ? publishNow(row) : undefined))
          .catch((e) =>
            logger.error(`config sync for ${accessKeyId} failed: ${e.message}`)
          );
      }, deps.debounceMs ?? 500);
      timer.unref?.();
      timers.set(accessKeyId, timer);
    },

    /** The answer to `region.R.config.request` (contract §3). */
    async answer(row: RegionRow, haveVersion: number) {
      if (paused(row)) {
        const s = service.statusOf(row);
        return {
          type: "region.config.paused",
          reason: s.reason,
          requiredVersion: s.requiredVersion
        };
      }
      if (row.configVersion > 0 && haveVersion === row.configVersion)
        return {
          type: "region.config.current",
          configVersion: row.configVersion
        };
      if (row.configVersion === 0) return publishNow(row);
      const kinds = await snapshot(row.accessKeyId);
      return {
        type: "region.config",
        configVersion: row.configVersion,
        full: true,
        kinds
      } as ConfigMessage;
    },

    /** After a heartbeat: a supported cell behind the current version gets the snapshot again. */
    async afterHeartbeat(row: RegionRow) {
      if (paused(row) || row.state !== "enrolled") return;
      if (row.configVersion === 0) {
        await publishNow(row);
      } else if (row.reportedConfig < row.configVersion) {
        // Resend the current version (no bump): the cell missed it while offline.
        const kinds = await snapshot(row.accessKeyId);
        publish(subjects(row.ref).config, {
          type: "region.config",
          configVersion: row.configVersion,
          full: true,
          kinds
        } as ConfigMessage);
      }
    },

    stop() {
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    }
  };
}

export type ConfigSync = ReturnType<typeof createConfigSync>;
