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
import { NatsConnection, StringCodec } from "nats";
import { ProvidersDb } from "./createProvidersHandlers";

// Runtime catalog use (add-provider-registry, build log LO-B11). Gateways publish one
// `registry.used` message per session and catalog id; the control plane counts sessions per
// workspace, id and day (for `fonoster-registry usage`) and keeps one runtime notice per workspace
// and deprecated or retired id. `listWarnings` turns the catalog's state, the workspace's saved
// configs and recent runtime use into the dashboard's warnings.

const logger = getLogger({ service: "apiserver", filePath: __filename });
const sc = StringCodec();

export const REGISTRY_USED_SUBJECT = "registry.used";

/** Runtime warnings stay this long after the last session that used the id. */
export const RUNTIME_WARNING_DAYS = 7;

export type CatalogUse = {
  workspaceRef: string | null;
  appRef: string;
  sessionRef: string;
  id: string;
  resolvedId?: string;
  event?: "provider.deprecated_used" | "provider.retired_used";
  replacement?: string;
  at?: string;
};

const ID = /^[a-z0-9][a-z0-9._-]*\/[^\s]{1,200}$/;
const RUNTIME_TYPES = ["provider.deprecated_used", "provider.retired_used"];

function valid(u: CatalogUse): boolean {
  return (
    typeof u?.workspaceRef === "string" &&
    u.workspaceRef.length > 0 &&
    typeof u.appRef === "string" &&
    typeof u.id === "string" &&
    ID.test(u.id) &&
    (u.event === undefined || RUNTIME_TYPES.includes(u.event))
  );
}

/** Counts one session's use of an id and, for deprecated or retired ids, updates the notice. */
export function createRecordCatalogUse(db: ProvidersDb) {
  return async (use: CatalogUse) => {
    if (!valid(use)) return false;
    const at =
      use.at && !isNaN(Date.parse(use.at)) ? new Date(use.at) : new Date();
    const day = new Date(at.toISOString().slice(0, 10));
    await db.registryUsage.upsert({
      where: {
        accessKeyId_catalogId_day: {
          accessKeyId: use.workspaceRef,
          catalogId: use.id,
          day
        }
      },
      create: {
        accessKeyId: use.workspaceRef,
        catalogId: use.id,
        day,
        sessions: 1
      },
      update: { sessions: { increment: 1 } }
    });
    if (!use.event) return true;
    const existing = await db.registryNotice.findFirst({
      where: {
        accessKeyId: use.workspaceRef,
        type: use.event,
        data: { path: ["id"], equals: use.id }
      }
    });
    const previous = (existing?.data ?? {}) as {
      apps?: string[];
      sessions?: number;
      firstSeenAt?: string;
    };
    const data = {
      id: use.id,
      replacement: use.replacement ?? null,
      apps: [...new Set([...(previous.apps ?? []), use.appRef])].slice(0, 50),
      sessions: (previous.sessions ?? 0) + 1,
      firstSeenAt: previous.firstSeenAt ?? at.toISOString(),
      lastSeenAt: at.toISOString(),
      lastSessionRef: use.sessionRef
    };
    if (existing)
      await db.registryNotice.update({
        where: { ref: existing.ref },
        data: { data }
      });
    else
      await db.registryNotice.create({
        data: { accessKeyId: use.workspaceRef, type: use.event, data }
      });
    return true;
  };
}

/** Consumes the gateways' `registry.used` messages (one apiserver replica per message). */
export function subscribeRegistryUsage(nc: NatsConnection, db: ProvidersDb) {
  const record = createRecordCatalogUse(db);
  const sub = nc.subscribe(REGISTRY_USED_SUBJECT, {
    queue: "apiserver-registry-usage",
    callback: (err, msg) => {
      if (err) return;
      let use: CatalogUse;
      try {
        use = JSON.parse(sc.decode(msg.data));
      } catch {
        return;
      }
      record(use).catch((e) =>
        logger.warn(`could not record catalog use: ${e.message}`)
      );
    }
  });
  return () => sub.unsubscribe();
}

export type WarningUse = {
  kind: "app" | "assistant";
  ref: string;
  name: string;
  /** The config field that names the id: voice, ttsModel, sttModel, llm. */
  field: string;
  /** For a TTS model: the voice the config uses with it (e.g. a workspace's cloned voice). */
  voice?: string;
};

export type Warning = {
  id: string;
  kind: "provider" | "model" | "voice";
  state: "deprecated" | "retired";
  replacement: string;
  retireOn: string;
  /** Saved configs of the workspace that reference the id (or a model or voice of a provider). */
  usedBy: WarningUse[];
  /** Apps whose sessions resolved the id lately, including ids no saved config names. */
  runtimeApps: string[];
  runtimeSessions: number;
  lastUsedAt: string;
};

type Entry = {
  id: string;
  kind: Warning["kind"];
  state: string;
  replacement: string | null;
  retireOn: string | null;
};

/**
 * The workspace's catalog warnings (add-provider-registry "Warnings appear where the item is
 * used", "Switching clears the warning"): every deprecated or retired item that a saved config
 * names, or that a session used in the last RUNTIME_WARNING_DAYS days. A retired item still named
 * by a config is one whose usage had no compatible replacement.
 */
export async function listWarnings(
  db: ProvidersDb,
  accessKeyId: string,
  now = new Date()
): Promise<Warning[]> {
  const notActive = { state: { not: "ACTIVE" } };
  const [providers, models, voices, apps, notices] = await Promise.all([
    db.registryProvider.findMany({ where: notActive }),
    db.registryModel.findMany({ where: notActive }),
    db.registryVoice.findMany({
      where: {
        ...notActive,
        OR: [{ ownerWorkspace: null }, { ownerWorkspace: accessKeyId }]
      }
    }),
    db.application.findMany({
      where: { accessKeyId },
      select: {
        ref: true,
        name: true,
        speechVoice: true,
        speechTtsModel: true,
        speechSttModel: true,
        intelligence: { select: { config: true } }
      },
      orderBy: { ref: "asc" }
    }),
    db.registryNotice.findMany({
      where: { accessKeyId, type: { in: RUNTIME_TYPES } }
    })
  ]);
  const entries = new Map<string, Entry>();
  const add = (kind: Entry["kind"]) => (r: Record<string, unknown>) =>
    entries.set(r.id as string, {
      id: r.id as string,
      kind,
      state: String(r.state).toLowerCase(),
      replacement: (r.replacement as string) ?? null,
      retireOn: (r.retireOn as string) ?? null
    });
  providers.forEach(add("provider"));
  models.forEach(add("model"));
  voices.forEach(add("voice"));

  /** The flagged entries an id falls under: itself, and its provider. */
  const flagged = (id: string) =>
    [entries.get(id), entries.get(id.split("/")[0])].filter((e): e is Entry =>
      Boolean(e)
    );

  const warnings = new Map<string, Warning>();
  const warning = (e: Entry) => {
    let w = warnings.get(e.id);
    if (!w) {
      w = {
        id: e.id,
        kind: e.kind,
        state: e.state as Warning["state"],
        replacement: e.replacement ?? "",
        retireOn: e.retireOn ?? "",
        usedBy: [],
        runtimeApps: [],
        runtimeSessions: 0,
        lastUsedAt: ""
      };
      warnings.set(e.id, w);
    }
    return w;
  };

  for (const app of apps as Record<string, unknown>[]) {
    const config = app.intelligence as { config?: unknown } | null;
    const assistant = config?.config as
      | {
          languageModel?: { model?: string };
          conversationSettings?: { voice?: string };
        }
      | undefined;
    const refs: [string | undefined | null, WarningUse["kind"], string][] = [
      [app.speechVoice as string, "app", "voice"],
      [app.speechTtsModel as string, "app", "ttsModel"],
      [app.speechSttModel as string, "app", "sttModel"],
      [assistant?.languageModel?.model, "assistant", "llm"],
      [assistant?.conversationSettings?.voice, "assistant", "voice"]
    ];
    for (const [id, kind, field] of refs) {
      if (!id) continue;
      for (const e of flagged(id))
        warning(e).usedBy.push({
          kind,
          ref: app.ref as string,
          name: app.name as string,
          field,
          ...(field === "ttsModel" && app.speechVoice
            ? { voice: app.speechVoice as string }
            : {})
        });
    }
  }

  const since = now.getTime() - RUNTIME_WARNING_DAYS * 24 * 3600 * 1000;
  for (const n of notices as { data: Record<string, unknown> }[]) {
    const d = n.data;
    const last = Date.parse(String(d.lastSeenAt ?? ""));
    if (!(last >= since)) continue;
    for (const e of flagged(String(d.id))) {
      const w = warning(e);
      w.runtimeApps = [
        ...new Set([...w.runtimeApps, ...((d.apps as string[]) ?? [])])
      ];
      w.runtimeSessions += Number(d.sessions ?? 0);
      if (!w.lastUsedAt || String(d.lastSeenAt) > w.lastUsedAt)
        w.lastUsedAt = String(d.lastSeenAt);
    }
  }
  return [...warnings.values()].sort((a, b) => a.id.localeCompare(b.id));
}
