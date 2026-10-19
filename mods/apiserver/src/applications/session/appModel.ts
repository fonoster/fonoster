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
import {
  assertPublicWebSocketUrlShape,
  datesMapper,
  sessionAgentSchema
} from "@fonoster/common";
import { struct } from "pb-util";
import { z } from "zod";

// The session app model on `applications` rows (voice-session G2; build log P-B8, CP-B1..CP-B4).
// A row is a session app when it has `url` and `signingSecret`; AppBridge reads those columns
// (mods/appbridge/src/apps/AppStore.ts).

/** The rebuild columns are newer than the shared generated client, so the slice is typed loosely. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppsDb = any;

export type SessionAppsConfig = {
  /** The hosted Autopilot's session URL; Autopilot apps default to it. */
  autopilotUrl: string;
  /** One secret for every Autopilot app (the hosted Autopilot verifies a single secret). */
  autopilotSigningSecret?: string;
  /**
   * Private hosts, IPs or CIDRs app and listener URLs may use (self-hosting); default
   * FONOSTER_ALLOWED_DESTINATIONS. Everything else must be public (M14).
   */
  allowedDestinations?: string[];
};

/**
 * App and listener URLs are the tenant's choice and AppBridge dials them, so they must not
 * name the platform's own network: no internal names (localhost, *.svc, single labels) and no
 * private, loopback or metadata IPs, unless allowed by the operator. The hosted Autopilot URL
 * comes from configuration and is exempt. AppBridge re-checks resolved addresses on connect.
 */
function checkDestination(
  value: string,
  what: string,
  config: SessionAppsConfig
) {
  if (value === config.autopilotUrl) return;
  try {
    assertPublicWebSocketUrlShape(
      value,
      config.allowedDestinations
        ? { allow: config.allowedDestinations }
        : undefined
    );
  } catch (e) {
    throw invalid(`${what} must be a public address: ${(e as Error).message}`);
  }
}

export const DEFAULT_VOICE = "deepgram/aura-2-thalia-en";
export const DEFAULT_LANGUAGE = "en-US";

const CATALOG_ID = /^[a-z0-9-]+\/.+/;
const catalogId = (what: string) =>
  z
    .string()
    .regex(CATALOG_ID, `${what} must be a catalog id like provider/name`);

const wsUrl = (what: string) =>
  z
    .string()
    .url(`${what} must be a URL`)
    .regex(/^wss?:\/\//, `${what} must start with ws:// or wss://`)
    .max(1024);

/** Proto3 sends "" and 0 for unset fields; treat them as absent. */
const blank = (v: unknown) =>
  v === "" || v === 0 || v === null || v === undefined ? undefined : v;
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(blank, schema.optional());

const speechSchema = z
  .object({
    voice: optional(catalogId("speech.voice")),
    language: optional(z.string().min(2).max(64)),
    sttModel: optional(catalogId("speech.sttModel")),
    ttsModel: optional(catalogId("speech.ttsModel")),
    silenceTimeoutMs: optional(z.number().int().min(100).max(120_000)),
    patience: optional(z.enum(["low", "normal", "high"]))
  })
  .default({});

const audioSchema = z
  .object({
    codec: z.enum(["pcm16", "pcmu"], {
      message: "audio.codec must be pcm16 or pcmu"
    }),
    rate: z.union([z.literal(8000), z.literal(16000), z.literal(24000)], {
      message: "audio.rate must be 8000, 16000 or 24000"
    })
  })
  .refine((a) => a.codec !== "pcmu" || a.rate === 8000, {
    message: "pcmu audio is 8000 Hz only"
  });

/** What create and update accept for the session app model (update replaces all of it). */
export const sessionAppInputSchema = z.object({
  name: z.string().min(1, "name is required").max(255),
  type: z
    .enum(["STREAM", "AUTOPILOT"], {
      errorMap: (_issue, ctx) => ({
        message:
          ctx.data === "EXTERNAL"
            ? "type EXTERNAL was renamed to STREAM"
            : "type must be STREAM or AUTOPILOT"
      })
    })
    .default("STREAM"),
  url: optional(wsUrl("url")),
  protocol: optional(
    z.enum(["fonoster", "twilio"], {
      errorMap: (_issue, ctx) => ({
        message:
          ctx.data === "native"
            ? "protocol native was renamed to fonoster"
            : "protocol must be fonoster or twilio"
      })
    })
  ),
  speech: z.preprocess((v) => v ?? undefined, speechSchema),
  audio: z.preprocess(
    (v) =>
      v && typeof v === "object" && (v as { codec?: string }).codec
        ? v
        : undefined,
    audioSchema.optional()
  ),
  fallbackAppRef: optional(z.string().max(64)),
  fallbackMessage: optional(z.string().max(1000)),
  listeners: z.preprocess(
    (v) => v ?? [],
    z
      .array(
        z.object({
          url: wsUrl("listeners.url"),
          tracks: z.preprocess(
            blank,
            z.enum(["inbound", "outbound", "both"]).default("both")
          )
        })
      )
      .max(4, "at most 4 listeners")
  ),
  recording: optional(z.enum(["off", "on", "consent"])),
  // AO-B1: answering-machine detection; absent (or enabled false) is off.
  amd: z.preprocess(
    (v) => v ?? undefined,
    z
      .object({
        enabled: z.boolean().default(false),
        windowMs: optional(z.number().int().min(500).max(15_000))
      })
      .optional()
  )
});

export type SessionAppInput = z.infer<typeof sessionAppInputSchema>;

export function newSigningSecret() {
  return randomBytes(32).toString("base64url");
}

export function secretHint(secret?: string | null) {
  return secret ? `…${secret.slice(-4)}` : "";
}

type BadRequest = { code: number; message: string };
const INVALID_ARGUMENT = 3;
export const invalid = (message: string): BadRequest => ({
  code: INVALID_ARGUMENT,
  message
});

/**
 * Validates the request and returns the columns to write (without the secret). Autopilot apps get
 * the hosted Autopilot URL and the fonoster protocol; the agent is checked with
 * sessionAgentSchema and kept on the Intelligence row as before.
 */
export async function toAppColumns(
  db: AppsDb,
  request: Record<string, unknown>,
  ctx: { accessKeyId: string; ref?: string; config: SessionAppsConfig }
) {
  const input = sessionAppInputSchema.parse(request);
  const autopilot = input.type === "AUTOPILOT";
  const url = input.url ?? (autopilot ? ctx.config.autopilotUrl : undefined);
  if (!url) throw invalid("url is required (ws:// or wss://)");
  checkDestination(url, "url", ctx.config);
  for (const listener of input.listeners)
    checkDestination(listener.url, "listeners.url", ctx.config);
  if ((request as { flavor?: unknown }).flavor !== undefined)
    throw invalid("flavor was renamed to protocol (fonoster or twilio)");
  const protocol = input.protocol ?? "fonoster";
  if (autopilot && protocol !== "fonoster")
    throw invalid("Autopilot agents use the fonoster protocol");

  let agent: Record<string, unknown> | undefined;
  if (autopilot) {
    const intelligence = request.intelligence as
      | { config?: unknown }
      | undefined;
    const raw = intelligence?.config;
    if (!raw) throw invalid("intelligence.config (the agent) is required");
    const decoded =
      (raw as { fields?: unknown }).fields !== undefined
        ? struct.decode(raw as Parameters<typeof struct.decode>[0])
        : (raw as Record<string, unknown>);
    const parsed = sessionAgentSchema.safeParse(decoded);
    if (!parsed.success)
      throw invalid(
        `invalid agent: ${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; ")}`
      );
    agent = decoded;
  }

  if (input.fallbackAppRef) {
    if (input.fallbackAppRef === ctx.ref)
      throw invalid("an app cannot be its own fallback");
    const fallback = await db.application.findFirst({
      where: { ref: input.fallbackAppRef, accessKeyId: ctx.accessKeyId },
      select: { ref: true }
    });
    if (!fallback)
      throw invalid("fallbackAppRef: no such app in this workspace");
  }

  await checkCatalogIds(db, input.speech);

  const speech = input.speech;
  const columns = {
    name: input.name,
    type: input.type,
    // The legacy column is required; it mirrors the session URL.
    endpoint: url.slice(0, 255),
    url,
    protocol,
    speechVoice: speech.voice ?? DEFAULT_VOICE,
    speechLanguage: speech.language ?? DEFAULT_LANGUAGE,
    speechSttModel: speech.sttModel ?? null,
    speechTtsModel: speech.ttsModel ?? null,
    silenceTimeoutMs: speech.silenceTimeoutMs ?? null,
    patience: speech.patience ?? null,
    audio: protocol === "fonoster" && input.audio ? input.audio : null,
    listeners: input.listeners.length ? input.listeners : null,
    fallbackAppRef: input.fallbackAppRef ?? null,
    fallbackMessage: input.fallbackMessage ?? null,
    recording: input.recording ?? null,
    amd: input.amd?.enabled ?? false,
    amdWindowMs: input.amd?.enabled ? (input.amd.windowMs ?? null) : null
  };
  return { columns, agent, autopilot };
}

/**
 * Catalog ids must exist (and not be retired) once the registry has entries of that kind; an
 * empty registry (a fresh install) accepts any well-formed id.
 */
async function checkCatalogId(
  db: AppsDb,
  table: "registryVoice" | "registryModel",
  id: string | undefined,
  what: string
) {
  if (!id || !db[table]) return;
  if ((await db[table].count()) === 0) return;
  const row = await db[table].findUnique({ where: { id } });
  if (!row) throw invalid(`${what} ${id} is not in the catalog`);
  if (row.state === "RETIRED")
    throw invalid(
      `${what} ${id} is retired${row.replacement ? `; use ${row.replacement}` : ""}`
    );
}

async function checkCatalogIds(db: AppsDb, speech: SessionAppInput["speech"]) {
  await checkCatalogId(db, "registryVoice", speech.voice, "voice");
  await checkCatalogId(db, "registryModel", speech.sttModel, "speech.sttModel");
  await checkCatalogId(db, "registryModel", speech.ttsModel, "speech.ttsModel");
}

/**
 * The Intelligence row for an Autopilot app. The model is a catalog id, checked like the app's
 * speech ids; its provider's `llm.<provider>` product row (the legacy table Intelligence points
 * to) is added on first use, so any catalog provider works without a seeded product.
 */
export async function agentRow(db: AppsDb, agent: Record<string, unknown>) {
  const model = (agent.languageModel as { model: string }).model;
  await checkCatalogId(db, "registryModel", model, "languageModel.model");
  const provider = model.split("/")[0];
  const productRef = `llm.${provider}`;
  await db.product.upsert({
    where: { ref: productRef },
    create: { ref: productRef, name: provider, vendor: "GENERIC", type: "LLM" },
    update: {}
  });
  return { productRef, config: agent };
}

type Row = Record<string, unknown> & {
  intelligence?: { productRef: string; config: unknown } | null;
};

/** An `applications` row as the API's Application (never the secret). */
export function rowToApplication(row: Row) {
  const listeners = (row.listeners as unknown[] | null) ?? [];
  const app: Record<string, unknown> = {
    ref: row.ref,
    name: row.name,
    type: row.type,
    url: row.url ?? "",
    protocol: row.protocol ?? "",
    signingSecretHint: secretHint(row.signingSecret as string | null),
    speech: {
      voice: row.speechVoice ?? "",
      language: row.speechLanguage ?? "",
      sttModel: row.speechSttModel ?? "",
      ttsModel: row.speechTtsModel ?? "",
      silenceTimeoutMs: row.silenceTimeoutMs ?? 0,
      patience: row.patience ?? ""
    },
    audio: row.audio ?? undefined,
    fallbackAppRef: row.fallbackAppRef ?? "",
    fallbackMessage: row.fallbackMessage ?? "",
    listeners,
    recording: row.recording ?? "",
    amd: { enabled: row.amd === true, windowMs: row.amdWindowMs ?? 0 },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
  if (row.intelligence) {
    app.intelligence = {
      productRef: row.intelligence.productRef,
      config: row.intelligence.config
        ? struct.encode(row.intelligence.config as Record<string, never>)
        : null
    };
  }
  return datesMapper(app as never) as Record<string, unknown>;
}
