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
import { randomBytes } from "crypto";
import { Registry } from "@fonoster/common";
import { getLogger } from "@fonoster/logger";
import { normalizeSnapshot, UNKNOWN_WORKSPACE } from "../snapshot";
import { ConfigSnapshot, Row, WorkspaceKinds } from "../types";

const logger = getLogger({ service: "region-agent", filePath: __filename });

// Applies a config snapshot to the cell's database (RC-B6): the apiserver's own schema and tables,
// so the cell's AppBridge (`appStore`/`registry`/`webhooks: database`) and hosted Autopilot
// (`agents: database`) read them exactly as they do in a public region. A snapshot is
// authoritative and carries every workspace of the region (PR-14): apps and webhook endpoints of a
// workspace that are not in it are removed, and a workspace missing from it is removed entirely.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/** Columns of `applications` the cell takes from a snapshot row. */
const APP_COLUMNS = [
  "name",
  "type",
  "endpoint",
  "url",
  "protocol",
  "signingSecret",
  "speechVoice",
  "speechLanguage",
  "speechSttModel",
  "speechTtsModel",
  "speechSettings",
  "silenceTimeoutMs",
  "audio",
  "filters",
  "listeners",
  "fallbackAppRef",
  "fallbackMessage",
  "recording",
  "patience"
] as const;

const VENDORS: Record<string, string> = {
  openai: "OPENAI",
  groq: "GROQ",
  anthropic: "ANTHROPIC",
  google: "GOOGLE",
  deepgram: "DEEPGRAM",
  elevenlabs: "ELEVEN_LABS",
  microsoft: "MICROSOFT",
  amazon: "AMAZON"
};

export type CellAutopilot = {
  /** The cell's hosted Autopilot (PR-9), e.g. ws://autopilot:3000. */
  url?: string;
  /** The secret the cell's AppBridge signs Autopilot sessions with. */
  signingSecret?: string;
};

export type ApplyResult = {
  apps: number;
  removedApps: number;
  agents: number;
  catalog: number;
  webhooks: number;
  removedWebhooks: number;
  retention?: number;
  /** Workspaces the snapshot carried (applied). */
  workspaces: string[];
  /** Workspaces found in the cell but gone from the snapshot (their rows were removed). */
  removedWorkspaces: string[];
};

/** An API-shaped app (`speech: {voice, …}`) as columns; column-shaped rows pass through. */
function appColumns(row: Row): Record<string, unknown> {
  const speech = (row.speech ?? {}) as Row;
  const aliased: Row = {
    ...row,
    speechVoice: row.speechVoice ?? speech.voice,
    speechLanguage: row.speechLanguage ?? speech.language,
    speechSttModel: row.speechSttModel ?? speech.sttModel,
    speechTtsModel: row.speechTtsModel ?? speech.ttsModel,
    speechSettings: row.speechSettings ?? speech.settings,
    silenceTimeoutMs: row.silenceTimeoutMs ?? speech.silenceTimeoutMs,
    fallbackAppRef:
      row.fallbackAppRef ?? (row.fallback as Row | undefined)?.app,
    fallbackMessage:
      row.fallbackMessage ?? (row.fallback as Row | undefined)?.message
  };
  const out: Record<string, unknown> = {};
  for (const c of APP_COLUMNS)
    if (aliased[c] !== undefined)
      out[c] = aliased[c] === null ? null : aliased[c];
  return out;
}

/** The agent of an app: from `agents` ({appRef, config}) or the row's `intelligence`. */
function agentsOf(kinds: WorkspaceKinds) {
  const out = new Map<string, { config: unknown; productRef?: string }>();
  for (const app of kinds.apps ?? []) {
    const intel = (app.intelligence ?? app.agent) as Row | undefined;
    if (intel)
      out.set(String(app.ref), {
        config: intel.config ?? intel,
        productRef: intel.productRef as string | undefined
      });
  }
  for (const a of kinds.agents ?? []) {
    const ref = String(a.appRef ?? a.applicationRef ?? a.ref ?? "");
    if (ref)
      out.set(ref, {
        config: a.config ?? a.agent,
        productRef: a.productRef as string | undefined
      });
  }
  return out;
}

export class DatabaseApplier {
  constructor(
    private readonly db: Db,
    private readonly options: {
      /** Old single-workspace snapshots (`kinds`) apply to this workspace. */
      workspaceRef?: string;
      autopilot?: CellAutopilot;
    } = {}
  ) {}

  /** Workspaces that have rows in the cell (everything there came from a snapshot). */
  async workspacesInCell(): Promise<string[]> {
    const [apps, hooks, retention] = await Promise.all([
      this.db.application.findMany({
        select: { accessKeyId: true },
        distinct: ["accessKeyId"]
      }),
      this.db.webhookEndpoint.findMany({
        select: { accessKeyId: true },
        distinct: ["accessKeyId"]
      }),
      this.db.callRecordRetention.findMany({
        select: { accessKeyId: true },
        distinct: ["accessKeyId"]
      })
    ]);
    return [
      ...new Set(
        [...apps, ...hooks, ...retention].map(
          (r: { accessKeyId: string }) => r.accessKeyId
        )
      )
    ].sort();
  }

  async apply(snapshot: ConfigSnapshot): Promise<ApplyResult> {
    const n = normalizeSnapshot(snapshot, this.options.workspaceRef);
    const result: ApplyResult = {
      apps: 0,
      removedApps: 0,
      agents: 0,
      catalog: 0,
      webhooks: 0,
      removedWebhooks: 0,
      workspaces: [],
      removedWorkspaces: []
    };
    // The catalog first: apps and agents name catalog ids.
    if (n.catalog) result.catalog = await this.applyCatalog(n.catalog);
    for (const [ws, w] of Object.entries(n.workspaces)) {
      if (ws === UNKNOWN_WORKSPACE) {
        logger.warn("an old single-workspace snapshot, but no workspace known");
        continue;
      }
      const r = await this.applyWorkspace(ws, w.kinds);
      result.apps += r.apps;
      result.removedApps += r.removedApps;
      result.agents += r.agents;
      result.webhooks += r.webhooks;
      result.removedWebhooks += r.removedWebhooks;
      if (r.retention !== undefined)
        result.retention = (result.retention ?? 0) + r.retention;
      result.workspaces.push(ws);
    }
    // A full snapshot names every workspace of the region; the rest left the region.
    if (snapshot.full !== false && snapshot.workspaces)
      for (const ws of await this.workspacesInCell()) {
        if (n.workspaces[ws]) continue;
        await this.removeWorkspace(ws);
        result.removedWorkspaces.push(ws);
      }
    return result;
  }

  /** Everything the cell holds for a workspace that left the region. */
  async removeWorkspace(ws: string) {
    await this.applyApps(ws, []);
    await this.applyWebhooks(ws, []);
    await this.applyRetention(ws, []);
    logger.info(`workspace ${ws} left the region; its config was removed`);
  }

  private async applyWorkspace(ws: string, k: WorkspaceKinds) {
    const r = {
      apps: 0,
      removedApps: 0,
      agents: 0,
      webhooks: 0,
      removedWebhooks: 0,
      retention: undefined as number | undefined
    };
    if (k.apps) {
      const a = await this.applyApps(
        ws,
        k.apps,
        typeof k.recordingPolicy === "string" ? k.recordingPolicy : undefined
      );
      r.apps = a.apps;
      r.removedApps = a.removed;
    }
    if (k.apps || k.agents) r.agents = await this.applyAgents(ws, k);
    if (k.recordingPolicy && typeof k.recordingPolicy === "object")
      r.retention = await this.applyRetention(
        ws,
        k.recordingPolicy.retention ?? []
      );
    if (k.webhooks) {
      const w = await this.applyWebhooks(ws, k.webhooks);
      r.webhooks = w.webhooks;
      r.removedWebhooks = w.removed;
    }
    return r;
  }

  private async applyApps(ws: string, rows: Row[], recordingPolicy?: string) {
    const keep = new Set<string>();
    for (const row of rows) {
      const ref = String(row.ref ?? "");
      if (!ref) continue;
      keep.add(ref);
      const cols = appColumns(row);
      // A snapshot from a control plane older than unify-vocabulary still says EXTERNAL/flavor.
      let type = String(cols.type ?? "STREAM").toUpperCase();
      if (type === "EXTERNAL") type = "STREAM";
      cols.type = type;
      if (cols.protocol === undefined && row.flavor !== undefined)
        cols.protocol = row.flavor === "native" ? "fonoster" : row.flavor;
      // PR-9: Autopilot apps run on the cell's own Autopilot, signed with the cell's secret.
      if (type === "AUTOPILOT" && this.options.autopilot?.url) {
        cols.url = this.options.autopilot.url;
        if (this.options.autopilot.signingSecret)
          cols.signingSecret = this.options.autopilot.signingSecret;
      }
      // The workspace's recording policy fills apps that inherit it (RC-B7).
      if (
        (cols.recording === undefined || cols.recording === null) &&
        recordingPolicy
      )
        cols.recording = recordingPolicy;
      cols.name = cols.name ?? ref;
      cols.endpoint = String(cols.endpoint ?? cols.url ?? "").slice(0, 255);
      const existing = await this.db.application.findUnique({ where: { ref } });
      if (existing && existing.accessKeyId !== ws) {
        logger.warn(
          `app ${ref} belongs to another workspace in this region; skipped`
        );
        continue;
      }
      if (!cols.signingSecret && !existing?.signingSecret) {
        // Without the app's secret the app cannot verify sessions; a fresh one keeps the row valid.
        logger.warn(
          `app ${ref}: the snapshot has no signing secret; generated one`
        );
        cols.signingSecret = randomBytes(32).toString("base64url");
      }
      const data = { ...cols, updatedAt: new Date() };
      if (existing) await this.db.application.update({ where: { ref }, data });
      else
        await this.db.application.create({
          data: { ref, accessKeyId: ws, ...data }
        });
    }
    const stale = (
      await this.db.application.findMany({
        where: { accessKeyId: ws },
        select: { ref: true }
      })
    )
      .map((a: { ref: string }) => a.ref)
      .filter((ref: string) => !keep.has(ref));
    if (stale.length)
      await this.db.application.deleteMany({ where: { ref: { in: stale } } });
    return { apps: keep.size, removed: stale.length };
  }

  private async ensureProduct(productRef: string) {
    const vendor =
      VENDORS[productRef.replace(/^llm\./, "").split(/[./]/)[0]] ?? "GENERIC";
    await this.db.product.upsert({
      where: { ref: productRef },
      create: { ref: productRef, name: productRef, vendor, type: "LLM" },
      update: {}
    });
  }

  private async applyAgents(ws: string, kinds: WorkspaceKinds) {
    const agents = agentsOf(kinds);
    let n = 0;
    for (const [appRef, a] of agents) {
      const app = await this.db.application.findUnique({
        where: { ref: appRef }
      });
      if (!app || app.accessKeyId !== ws) continue;
      const model = String(
        ((a.config as Row)?.languageModel as Row | undefined)?.model ??
          "generic"
      );
      const productRef = a.productRef ?? `llm.${model.split("/")[0]}`;
      await this.ensureProduct(productRef);
      await this.db.$transaction([
        this.db.intelligence.deleteMany({ where: { applicationRef: appRef } }),
        this.db.intelligence.create({
          data: { applicationRef: appRef, productRef, config: a.config }
        })
      ]);
      n++;
    }
    return n;
  }

  private async applyCatalog(entries: Row[]) {
    const store = await Registry.PrismaRegistryStore.open(this.db);
    const valid = entries.filter(
      (e) =>
        typeof e.id === "string" &&
        ["provider", "model", "voice"].includes(String(e.kind))
    );
    for (const e of valid)
      store.put({
        state: "active",
        ...e
      } as unknown as Registry.CatalogEntry);
    await store.flush();
    return valid.length;
  }

  /** The workspace's retention policies (call_record_retention), replaced as a whole. */
  private async applyRetention(
    accessKeyId: string,
    rows: { part: string; days: number }[]
  ) {
    const valid = rows.filter(
      (r) =>
        typeof r.part === "string" && Number.isInteger(r.days) && r.days > 0
    );
    await this.db.$transaction([
      this.db.callRecordRetention.deleteMany({ where: { accessKeyId } }),
      ...valid.map((r) =>
        this.db.callRecordRetention.create({
          data: { accessKeyId, part: r.part, days: r.days }
        })
      )
    ]);
    return valid.length;
  }

  private async applyWebhooks(ws: string, rows: Row[]) {
    const keep = new Set<string>();
    for (const row of rows) {
      const ref = String(row.ref ?? "");
      if (!ref || !row.url) continue;
      keep.add(ref);
      const existing = await this.db.webhookEndpoint.findUnique({
        where: { ref }
      });
      let secret =
        (row.secret as string | undefined) ?? existing?.secret ?? undefined;
      if (!secret) {
        // RC-B9: without the endpoint's secret, receivers cannot verify; generate one and warn.
        logger.warn(
          `webhook ${ref}: the snapshot has no secret; generated one`
        );
        secret = randomBytes(32).toString("base64url");
      }
      const data = {
        url: String(row.url),
        events: (row.events as string[]) ?? [],
        secret,
        previousSecret: (row.previousSecret as string | null) ?? null,
        previousUntil: row.previousUntil
          ? new Date(String(row.previousUntil))
          : null
      };
      if (existing)
        await this.db.webhookEndpoint.update({ where: { ref }, data });
      else
        await this.db.webhookEndpoint.create({
          data: { ref, accessKeyId: ws, ...data }
        });
    }
    const stale = (
      await this.db.webhookEndpoint.findMany({
        where: { accessKeyId: ws },
        select: { ref: true }
      })
    )
      .map((w: { ref: string }) => w.ref)
      .filter((ref: string) => !keep.has(ref));
    if (stale.length)
      await this.db.webhookEndpoint.deleteMany({
        where: { ref: { in: stale } }
      });
    return { webhooks: keep.size, removed: stale.length };
  }
}
