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
import { ConfigSnapshot, Row } from "../types";

const logger = getLogger({ service: "region-agent", filePath: __filename });

// Applies a config snapshot to the cell's database (RC-B6): the apiserver's own schema and tables,
// so the cell's gateway (`appStore`/`registry`/`webhooks: database`) and hosted Autopilot
// (`assistants: database`) read them exactly as they do in a public region. A snapshot is
// authoritative: apps and webhook endpoints of the workspace that are not in it are removed.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = any;

/** Columns of `applications` the cell takes from a snapshot row. */
const APP_COLUMNS = [
  "name",
  "type",
  "endpoint",
  "url",
  "flavor",
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
  /** The secret the cell's gateway signs Autopilot sessions with. */
  signingSecret?: string;
};

export type ApplyResult = {
  apps: number;
  removedApps: number;
  assistants: number;
  catalog: number;
  webhooks: number;
  removedWebhooks: number;
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

/** The assistant of an app: from `assistants` ({appRef, config}) or the row's `intelligence`. */
function assistantsOf(snapshot: ConfigSnapshot) {
  const out = new Map<string, { config: unknown; productRef?: string }>();
  for (const app of snapshot.kinds.apps ?? []) {
    const intel = (app.intelligence ?? app.assistant) as Row | undefined;
    if (intel)
      out.set(String(app.ref), {
        config: intel.config ?? intel,
        productRef: intel.productRef as string | undefined
      });
  }
  for (const a of snapshot.kinds.assistants ?? []) {
    const ref = String(a.appRef ?? a.applicationRef ?? a.ref ?? "");
    if (ref)
      out.set(ref, {
        config: a.config ?? a.assistant,
        productRef: a.productRef as string | undefined
      });
  }
  return out;
}

export class DatabaseApplier {
  constructor(
    private readonly db: Db,
    private readonly options: {
      workspaceRef: string;
      autopilot?: CellAutopilot;
    }
  ) {}

  async apply(snapshot: ConfigSnapshot): Promise<ApplyResult> {
    const k = snapshot.kinds;
    const result: ApplyResult = {
      apps: 0,
      removedApps: 0,
      assistants: 0,
      catalog: 0,
      webhooks: 0,
      removedWebhooks: 0
    };
    // The catalog first: apps and assistants name catalog ids.
    if (k.catalog) result.catalog = await this.applyCatalog(k.catalog);
    if (k.apps) {
      const r = await this.applyApps(k.apps, k.recordingPolicy ?? undefined);
      result.apps = r.apps;
      result.removedApps = r.removed;
    }
    if (k.apps || k.assistants)
      result.assistants = await this.applyAssistants(snapshot);
    if (k.webhooks) {
      const r = await this.applyWebhooks(k.webhooks);
      result.webhooks = r.webhooks;
      result.removedWebhooks = r.removed;
    }
    return result;
  }

  private async applyApps(rows: Row[], recordingPolicy?: string) {
    const ws = this.options.workspaceRef;
    const keep = new Set<string>();
    for (const row of rows) {
      const ref = String(row.ref ?? "");
      if (!ref) continue;
      keep.add(ref);
      const cols = appColumns(row);
      const type = String(cols.type ?? "EXTERNAL").toUpperCase();
      cols.type = type;
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
          `app ${ref} belongs to another workspace in this cell; skipped`
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

  private async applyAssistants(snapshot: ConfigSnapshot) {
    const assistants = assistantsOf(snapshot);
    let n = 0;
    for (const [appRef, a] of assistants) {
      const app = await this.db.application.findUnique({
        where: { ref: appRef }
      });
      if (!app || app.accessKeyId !== this.options.workspaceRef) continue;
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

  private async applyWebhooks(rows: Row[]) {
    const ws = this.options.workspaceRef;
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
