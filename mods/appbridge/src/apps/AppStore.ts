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
import { isAppAudioFormat } from "../audio/pcm";
import {
  AppConfig,
  Protocol,
  RECORDING_POLICIES,
  RecordingPolicy
} from "../config";

const logger = getLogger({ service: "appbridge", filePath: __filename });

/**
 * Where AppBridge finds apps (voice-session G2). Lookups are synchronous: a store answers from
 * memory and refreshes in the background (build log P-B7).
 */
export interface AppStore {
  find(ref: string): AppConfig | undefined;
  /** Development fallback when Routr sent no `X-App-Ref` (B21). */
  forNumber(to: string): AppConfig | undefined;
  count(): number;
  stop?(): void;
}

/** Apps from AppBridge YAML (`apps:`): self-hosting without a database, and tests. */
export class YamlAppStore implements AppStore {
  constructor(private readonly apps: AppConfig[]) {}

  find(ref: string) {
    return this.apps.find((a) => a.ref === ref);
  }

  /** The app a dialed number routes to; apps without numbers catch everything else. */
  forNumber(to: string) {
    return (
      this.apps.find((a) => a.numbers?.includes(to)) ??
      this.apps.find((a) => !a.numbers?.length)
    );
  }

  count() {
    return this.apps.length;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;
type Row = Record<string, unknown>;

/** An `applications` row with the session app model, or undefined if it has none or is invalid. */
export function appFromRow(row: Row): AppConfig | undefined {
  const url = row.url as string | null;
  const secret = row.signingSecret as string | null;
  if (!url || !secret) return undefined;
  const protocol = ((row.protocol as string | null) ?? "fonoster") as Protocol;
  if (!/^wss?:\/\//.test(url) || !["fonoster", "twilio"].includes(protocol)) {
    logger.warn(`app ${row.ref}: invalid url or protocol, ignored`);
    return undefined;
  }
  const app: AppConfig = {
    ref: row.ref as string,
    url,
    protocol,
    signingSecret: secret,
    speech: {
      voice: (row.speechVoice as string | null) ?? "",
      language: (row.speechLanguage as string | null) ?? "en-US"
    },
    workspaceRef: row.accessKeyId as string
  };
  if (row.speechSttModel) app.speech.sttModel = row.speechSttModel as string;
  // speech_settings.hints (or keyterms): the app's default recognition hints (VO-B3).
  const settings = (row.speechSettings ?? {}) as Record<string, unknown>;
  const hints = settings.hints ?? settings.keyterms;
  if (Array.isArray(hints))
    app.speech.hints = hints.filter((h): h is string => typeof h === "string");
  if (row.silenceTimeoutMs != null)
    app.speech.silenceTimeoutMs = row.silenceTimeoutMs as number;
  // rebuild: control (CP-B1): patience and the recording policy columns.
  if (["low", "normal", "high"].includes(row.patience as string))
    app.speech.patience = row.patience as "low" | "normal" | "high";
  if (RECORDING_POLICIES.includes(row.recording as RecordingPolicy))
    app.recording = row.recording as RecordingPolicy;
  // AO-B1: the amd / amd_window_ms columns (add-roomr 4.3).
  if (row.amd === true)
    app.amd =
      row.amdWindowMs != null ? { windowMs: row.amdWindowMs as number } : true;
  // Off-menu formats (never written by the API) fall back to the default pcm16 16 kHz.
  if (row.audio && isAppAudioFormat(row.audio as Record<string, unknown>))
    app.audio = row.audio as AppConfig["audio"];
  if (row.filters) app.filters = row.filters as AppConfig["filters"];
  if (row.listeners)
    app.listeners = (row.listeners as AppConfig["listeners"])!.slice(0, 4);
  if (row.fallbackAppRef || row.fallbackMessage) {
    app.fallback = {};
    if (row.fallbackAppRef) app.fallback.app = row.fallbackAppRef as string;
    if (row.fallbackMessage)
      app.fallback.message = row.fallbackMessage as string;
  }
  return app;
}

export type PrismaAppStoreOptions = {
  /** How old the in-memory apps may get (default 5 s). */
  cacheMs?: number;
};

/**
 * Apps from the control-plane database (`applications` rows with a `url`). Signing secrets are
 * encrypted columns, so the client needs the apiserver's encryption key. Numbers stay in Routr,
 * which passes the app in `X-App-Ref`; `forNumber` finds nothing.
 */
export class PrismaAppStore implements AppStore {
  private apps = new Map<string, AppConfig>();
  private timer?: ReturnType<typeof setInterval>;
  private refreshing?: Promise<void>;

  private constructor(private readonly prisma: PrismaLike) {}

  static async open(
    prisma: PrismaLike,
    options: PrismaAppStoreOptions = {}
  ): Promise<PrismaAppStore> {
    const store = new PrismaAppStore(prisma);
    await store.refresh();
    const every = options.cacheMs ?? 5000;
    if (every > 0) {
      store.timer = setInterval(() => {
        store
          .refresh()
          .catch((e) =>
            logger.warn(`app refresh failed, keeping cached apps: ${e.message}`)
          );
      }, every);
      store.timer.unref?.();
    }
    return store;
  }

  /** Reloads every app with a session URL (one query; concurrent calls share it). */
  refresh(): Promise<void> {
    this.refreshing ??= (async () => {
      try {
        const rows: Row[] = await this.prisma.application.findMany({
          where: { url: { not: null } }
        });
        const apps = new Map<string, AppConfig>();
        for (const row of rows) {
          const app = appFromRow(row);
          if (!app) continue;
          // Tenant URLs: public destinations only. Autopilot apps point at the hosted
          // Autopilot (configuration, checked by the apiserver when overridden).
          app.publicDestinationsOnly = {
            url: row.type !== "AUTOPILOT",
            listeners: true
          };
          apps.set(app.ref, app);
        }
        this.apps = apps;
      } finally {
        this.refreshing = undefined;
      }
    })();
    return this.refreshing;
  }

  find(ref: string) {
    return this.apps.get(ref);
  }

  forNumber(): AppConfig | undefined {
    return undefined;
  }

  count() {
    return this.apps.size;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
  }
}
