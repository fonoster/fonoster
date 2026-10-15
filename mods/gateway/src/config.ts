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
import { parse } from "yaml";

export type Flavor = "native" | "twilio";

/** An app: a WebSocket URL, a flavor and speech defaults (voice-session, G2). */
export type AppConfig = {
  ref: string;
  url: string;
  flavor: Flavor;
  signingSecret: string;
  /** Default voice and language as catalog ids; STT language defaults to `language`. */
  speech: { voice: string; language: string; silenceTimeoutMs?: number };
  /** Caller and agent audio format for the native flavor (default pcm16 at 16 kHz). */
  audio?: { codec: "pcm16" | "pcmu"; rate: number };
  /** Numbers routed to this app (inbound). */
  numbers?: string[];
  fallback?: { app?: string; message?: string };
  /** Listen-only sockets dialed for every session of this app (signed with its secret). */
  listeners?: { url: string; tracks?: "inbound" | "outbound" | "both" }[];
};

export type ProviderConfig = {
  adapter: "fake";
  capabilities: ("tts" | "stt")[];
  /** Base URLs of the provider endpoints. */
  tts?: { url: string; timeoutMs?: number };
  stt?: { url: string };
  /** Voices offered under this provider's catalog ids (`<provider>/<voice>`); omit to allow any. */
  voices?: string[];
};

export type GatewayConfig = {
  nats: { url: string };
  rtp?: { host?: string; advertiseHost?: string };
  apps: AppConfig[];
  providers: Record<string, ProviderConfig>;
  /** The provider used for STT (default: the first provider with the stt capability). */
  stt?: { provider?: string };
  /** Retry window while an app is unreachable (default 2500 ms, every 250 ms). */
  retry?: { windowMs?: number; intervalMs?: number };
  /** Maximum queued output before `queue_full` (default 120 s). */
  outputQueueMaxMs?: number;
  /** The Twilio-compatible hang-up endpoint (twilio-media-streams-flavor). */
  http?: { host?: string; port: number; accountSid: string; authToken: string };
  /** Keepalive overrides (mainly for tests). */
  keepalive?: { pingIntervalMs?: number; idleTimeoutMs?: number };
  /** Enables the `fake` adapters (conformance "Implementations ship fake provider adapters"). */
  testMode?: boolean;
};

export const DEFAULTS = {
  retryWindowMs: 2500,
  retryIntervalMs: 250,
  outputQueueMaxMs: 120_000,
  silenceTimeoutMs: 600,
  /** WebSocket keepalive (design OQ4): ping every 10 s, a silent socket is dropped after 30 s. */
  pingIntervalMs: 10_000,
  idleTimeoutMs: 30_000,
  /** Handoff limits (design OQ6). */
  maxHandoffPayloadBytes: 16 * 1024,
  maxHandoffsPerCall: 5,
  ttsTimeoutMs: 3000
};

export function validateConfig(config: GatewayConfig): string[] {
  const problems: string[] = [];
  if (!config.nats?.url) problems.push("nats.url is required");
  const refs = new Set<string>();
  for (const app of config.apps ?? []) {
    if (refs.has(app.ref)) problems.push(`duplicate app ref ${app.ref}`);
    refs.add(app.ref);
    if (!/^wss?:\/\//.test(app.url))
      problems.push(`app ${app.ref}: url must be ws:// or wss://`);
    if (!["native", "twilio"].includes(app.flavor))
      problems.push(`app ${app.ref}: unknown flavor ${app.flavor}`);
    if (!app.signingSecret)
      problems.push(`app ${app.ref}: signingSecret is required`);
    if ((app.listeners?.length ?? 0) > 4) {
      problems.push(`app ${app.ref}: at most 4 listeners`);
    }
    if (
      app.fallback?.app &&
      !(config.apps ?? []).some((a) => a.ref === app.fallback!.app)
    ) {
      problems.push(
        `app ${app.ref}: fallback app ${app.fallback.app} does not exist`
      );
    }
  }
  for (const [name, p] of Object.entries(config.providers ?? {})) {
    if (p.adapter === "fake" && !config.testMode) {
      problems.push(
        `provider ${name}: the fake adapter is only available in test mode`
      );
    }
  }
  return problems;
}

/** Loads the gateway's YAML config (one YAML file per service, PL5). */
export function loadConfig(file: string): GatewayConfig {
  const config = parse(fs.readFileSync(file, "utf8")) as GatewayConfig;
  const problems = validateConfig(config);
  if (problems.length)
    throw new Error(
      `invalid gateway config ${file}:\n  - ${problems.join("\n  - ")}`
    );
  return config;
}
