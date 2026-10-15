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

/** A speech product as the legacy tables store it (`tts.elevenlabs`, `stt.deepgram`, ...). */
export type LegacySpeechProduct = {
  productRef: string;
  config: Record<string, unknown>;
  /** Encrypted BYOK credentials; never copied or printed by the migration. */
  credentials?: string | null;
};

/** A legacy Application row with its speech relations (plain data, no Prisma types). */
export type LegacyApplication = {
  ref: string;
  accessKeyId: string;
  name: string;
  type: "EXTERNAL" | "AUTOPILOT";
  /** gRPC `host:port` of a VoiceServer (EXTERNAL); unused for AUTOPILOT. */
  endpoint: string;
  textToSpeech?: LegacySpeechProduct | null;
  speechToText?: LegacySpeechProduct | null;
  intelligence?: LegacySpeechProduct | null;
};

export type Flavor = "native" | "twilio";

/**
 * The new app model (voice-session: "An app is a WebSocket URL, a flavor and speech defaults"),
 * the same shape as the gateway's AppConfig.
 */
export type MigratedApplication = {
  ref: string;
  name: string;
  workspaceRef: string;
  url: string;
  flavor: Flavor;
  signingSecret: string;
  /** Catalog ids: voice `<provider>/<voice>`, language a BCP-47 tag (or `multi`). */
  speech: { voice: string; language: string };
  fallback?: { app?: string; message?: string };
};

export type MigrationNotice = {
  ref: string;
  level: "info" | "action";
  message: string;
};

export type MigrationOptions = {
  /** The hosted Autopilot's session URL (wss://...). Required when AUTOPILOT apps exist. */
  autopilotUrl?: string;
  /** Voice and language when an app has none (catalog ids). */
  defaults: { voice: string; language: string };
  /** URLs for EXTERNAL apps that moved (keyed by app ref); otherwise ws://<endpoint>. */
  urlOverrides?: Record<string, string>;
  /** A fallback message for every migrated app (spoken when the app is unreachable). */
  fallbackMessage?: string;
  /** Secret generator (tests inject a fixed one). */
  newSecret?: () => string;
  /**
   * The hosted Autopilot's signing secret. It verifies every Autopilot session with one secret,
   * so AUTOPILOT apps get this one instead of a generated secret (ST-B4).
   */
  autopilotSigningSecret?: string;
};

/** Where legacy apps come from and migrated apps go (Prisma in production, memory in tests). */
export interface ApplicationMigrationStore {
  listLegacy(): Promise<LegacyApplication[]>;
  /** Already-migrated apps by ref (a migrated app keeps its secret on re-runs). */
  getMigrated(ref: string): Promise<MigratedApplication | undefined>;
  saveMigrated(app: MigratedApplication): Promise<void>;
}
