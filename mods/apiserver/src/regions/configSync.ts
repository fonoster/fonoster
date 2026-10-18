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

/** One workspace's part of a snapshot (contract §3). */
export type WorkspaceConfig = {
  ref: string;
  name: string;
  /** The workspace's first SIP domain as the region writes it (PR-16). */
  domain: string | null;
  kinds: Omit<ConfigKinds, "catalog">;
};

export type ConfigMessage = {
  type: "region.config";
  configVersion: number;
  full: true;
  region: {
    ref: string;
    id: string;
    kind: string;
    sipDomain: string | null;
    rootDomain: string;
  };
  catalog: Record<string, unknown>[];
  workspaces: Record<string, WorkspaceConfig>;
};

/**
 * A cloud domain as the region writes it (PR-16): `<label>.<rootDomain>` becomes
 * `<label>.<sipDomain>`; another name keeps its first label; no sipDomain leaves it unchanged.
 */
export function regionDomainUri(
  uri: string,
  rootDomain: string,
  sipDomain?: string | null
) {
  if (!sipDomain || !uri) return uri;
  if (uri === sipDomain || uri.endsWith(`.${sipDomain}`)) return uri;
  const label =
    rootDomain && uri.endsWith(`.${rootDomain}`)
      ? uri.slice(0, -rootDomain.length - 1)
      : uri.split(".")[0];
  return `${label}.${sipDomain}`;
}

/**
 * Config sync to regions (task 2.4, PR-14): one full snapshot per region holding every workspace
 * bound to it (keyed by workspace), with an increasing configVersion, published on change
 * (debounced) and on request; paused while the region is `unsupported`.
 */
export function createConfigSync(deps: {
  db: RegionsDb;
  service: RegionService;
  sources: SnapshotSources;
  publish: LinkPublisher;
  debounceMs?: number;
  /**
   * How often this replica looks for changes whose debounced publish never happened (the replica
   * that took the change died inside the window, ST-3). 0 turns the sweep off.
   */
  sweepMs?: number;
  /** The cloud's SIP root domain (workspace domains end with it). */
  rootDomain?: () => string;
}) {
  const { db, service, sources, publish } = deps;
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const debounceMs = deps.debounceMs ?? 500;
  // A change still marked this long after it was made lost its publish.
  const staleMs = Math.max(2_000, debounceMs * 4);
  const rootDomain = () => deps.rootDomain?.() ?? "";

  const workspaceKinds = async (accessKeyId: string) => {
    const [{ apps, assistants }, numbers, routr, webhooks, recordingPolicy] =
      await Promise.all([
        sources.apps(accessKeyId),
        sources.numbers(accessKeyId),
        sources.routr(accessKeyId),
        sources.webhooks(accessKeyId),
        sources.recordingPolicy(accessKeyId)
      ]);
    return { numbers, apps, assistants, routr, webhooks, recordingPolicy };
  };

  const snapshot = async (
    row: RegionRow
  ): Promise<Omit<ConfigMessage, "type" | "configVersion" | "full">> => {
    const bound = await service.workspaces(row);
    const workspaces: Record<string, WorkspaceConfig> = {};
    const ids = new Set<string>();
    const providers = new Set<string>();
    for (const ws of bound) {
      const kinds = await workspaceKinds(ws.accessKeyId);
      const use = catalogUse(kinds.apps, kinds.assistants);
      use.ids.forEach((i) => ids.add(i));
      use.secrets.forEach((s) => providers.add(s.name));
      const first = (kinds.routr.domains as { domainUri?: string }[])[0]
        ?.domainUri;
      workspaces[ws.accessKeyId] = {
        ref: ws.ref,
        name: ws.name,
        domain: first
          ? regionDomainUri(first, rootDomain(), row.sipDomain)
          : null,
        kinds
      };
    }
    const catalog = await sources.catalog(
      [...ids].sort(),
      [...providers].sort()
    );
    return {
      region: {
        ref: row.ref,
        id: row.id,
        kind: row.kind,
        sipDomain: row.sipDomain ?? null,
        rootDomain: rootDomain()
      },
      catalog,
      workspaces
    };
  };

  /** Secret names (provider ids) per workspace and their union, with who uses them. */
  const secretsNeeded = async (row: RegionRow, only?: string) => {
    const bound = (await service.workspaces(row)).filter(
      (w) => !only || w.accessKeyId === only
    );
    const perWorkspace: Record<string, string[]> = {};
    const usedBy = new Map<string, Set<string>>();
    for (const ws of bound) {
      const { apps, assistants } = await sources.apps(ws.accessKeyId);
      const secrets = catalogUse(apps, assistants).secrets;
      perWorkspace[ws.accessKeyId] = secrets.map((s) => s.name);
      for (const s of secrets) {
        if (!usedBy.has(s.name)) usedBy.set(s.name, new Set());
        s.usedBy.forEach((b) =>
          usedBy.get(s.name)!.add(bound.length > 1 ? `${ws.name}: ${b}` : b)
        );
      }
    }
    const secrets = [...usedBy.entries()]
      .map(([name, by]) => ({ name, usedBy: [...by].sort() }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { secrets, perWorkspace };
  };

  const paused = (row: RegionRow) =>
    service.statusOf(row).status === "unsupported";

  const message = async (
    row: RegionRow,
    configVersion: number
  ): Promise<ConfigMessage> => ({
    type: "region.config",
    configVersion,
    full: true,
    ...(await snapshot(row))
  });

  const publishSecretsNeeded = async (row: RegionRow) => {
    const { secrets, perWorkspace } = await secretsNeeded(row);
    publish(subjects(row.ref).secretsNeeded, {
      type: "region.secrets.needed",
      names: secrets.map((s) => s.name),
      workspaces: perWorkspace
    });
  };

  /** Builds and publishes a new version; returns it, or undefined when paused or not enrolled. */
  const publishNow = async (row: RegionRow) => {
    if (row.state !== "enrolled" || paused(row)) return undefined;
    const startedAt = new Date();
    const updated: RegionRow = await db.region.update({
      where: { ref: row.ref },
      data: { configVersion: { increment: 1 } }
    });
    const m = await message(row, updated.configVersion);
    publish(subjects(row.ref).config, m);
    // Published: clear the mark, unless a change came in after this snapshot was started.
    await db.region.updateMany({
      where: { ref: row.ref, configChangedAt: { lte: startedAt } },
      data: { configChangedAt: null }
    });
    await publishSecretsNeeded(row);
    return m;
  };

  /**
   * Records the change in the database before debouncing its publish, so a replica that dies
   * inside the window does not lose it: `sweep()` on any replica publishes it (ST-3).
   */
  const markChanged = async (load: () => Promise<RegionRow | undefined>) => {
    const row = await load();
    if (!row) return;
    await db.region.updateMany({
      where: { ref: row.ref, configChangedAt: null },
      data: { configChangedAt: new Date() }
    });
  };

  /** Publishes regions whose change was marked but not published in time. */
  const sweep = async (now = Date.now()) => {
    const rows: RegionRow[] = await db.region.findMany({
      where: {
        configChangedAt: { lt: new Date(now - staleMs) },
        deletedAt: null
      }
    });
    const published: string[] = [];
    for (const row of rows) {
      if (row.state !== "enrolled" || paused(row)) continue;
      await publishNow(row);
      published.push(row.ref);
    }
    return published;
  };

  const sweeper =
    deps.sweepMs === 0
      ? undefined
      : setInterval(
          () =>
            void sweep().catch((e) =>
              logger.warn(`config sync sweep failed: ${e.message}`)
            ),
          deps.sweepMs ?? 5_000
        );
  sweeper?.unref?.();

  const schedule = (
    key: string,
    load: () => Promise<RegionRow | undefined>
  ) => {
    const marked = markChanged(load).catch((e) =>
      logger.error(`config sync could not mark ${key}: ${e.message}`)
    );
    clearTimeout(timers.get(key));
    const timer = setTimeout(() => {
      timers.delete(key);
      void load()
        .then((row) => (row ? publishNow(row) : undefined))
        .catch((e) =>
          logger.error(`config sync for ${key} failed: ${e.message}`)
        );
    }, debounceMs);
    timer.unref?.();
    timers.set(key, timer);
    return marked;
  };

  return {
    snapshot,
    secretsNeeded,
    publishNow,
    sweep,

    /**
     * A workspace's config changed: mark its region changed now and publish it soon (several
     * changes make one version). Resolves once the mark is stored.
     */
    onChange(accessKeyId: string) {
      // Debounced per workspace; the region is resolved when the timer fires.
      return schedule(`ws:${accessKeyId}`, () =>
        service.regionOfWorkspace(accessKeyId)
      );
    },

    /** A workspace joined or left a region (created or deleted): publish that region soon. */
    onRegionChange(regionKeyValue: string) {
      return schedule(`rg:${regionKeyValue}`, () =>
        service.regionByKey(regionKeyValue)
      );
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
      return message(row, row.configVersion);
    },

    /** After a heartbeat: a supported cell behind the current version gets the snapshot again. */
    async afterHeartbeat(row: RegionRow) {
      if (paused(row) || row.state !== "enrolled") return;
      if (row.configVersion === 0) {
        await publishNow(row);
      } else if (row.reportedConfig < row.configVersion) {
        // Resend the current version (no bump): the cell missed it while offline.
        publish(
          subjects(row.ref).config,
          await message(row, row.configVersion)
        );
      }
    },

    stop() {
      if (sweeper) clearInterval(sweeper);
      for (const t of timers.values()) clearTimeout(t);
      timers.clear();
    }
  };
}

export type ConfigSync = ReturnType<typeof createConfigSync>;
