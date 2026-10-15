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
import { isDetectorChoice } from "./turn/createDetector";

export type Flavor = "native" | "twilio";

/** An app: a WebSocket URL, a flavor and speech defaults (voice-session, G2). */
export type AppConfig = {
  ref: string;
  url: string;
  flavor: Flavor;
  signingSecret: string;
  /** Default voice and language as catalog ids; STT language defaults to `language`. */
  speech: {
    voice: string;
    language: string;
    silenceTimeoutMs?: number;
    /** The default Pacing policy's patience knob (turn-taking); default normal. */
    patience?: "low" | "normal" | "high";
    /** Turn Detector: baseline (default), backchannel-hold, stt, or a ws:// Detector URL. */
    detector?: string;
  };
  /** Caller and agent audio format for the native flavor (default pcm16 at 16 kHz). */
  audio?: { codec: "pcm16" | "pcmu"; rate: number };
  /** The workspace that owns the app (its access key id); the Twilio flavor's AccountSid. */
  workspaceRef?: string;
  /** Numbers routed to this app (inbound). */
  numbers?: string[];
  fallback?: { app?: string; message?: string };
  /** Audio filters applied to caller audio before STT and turn detection (VS18). */
  filters?: { name: string; options?: Record<string, unknown> }[];
  /** Listen-only sockets dialed for every session of this app (signed with its secret). */
  listeners?: { url: string; tracks?: "inbound" | "outbound" | "both" }[];
};

export type ProviderConfig = {
  adapter: "fake" | "deepgram" | "elevenlabs";
  capabilities: ("tts" | "stt")[];
  /**
   * The platform key for this provider (P3: platform keys live in operator config, never in the
   * catalog): read from an environment variable, or given inline in the YAML.
   */
  credential?: { env?: string; value?: string };
  /** Endpoint overrides (required for fake; optional for vendors, e.g. a regional host). */
  tts?: { url?: string; timeoutMs?: number; model?: string };
  stt?: { url?: string; model?: string };
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
  /**
   * The Twilio-compatible Calls endpoint. With `identity`, workspace API keys are checked through
   * Identity; otherwise the single accountSid/authToken pair applies (self-hosting).
   */
  http?: {
    host?: string;
    port: number;
    accountSid?: string;
    authToken?: string;
    identity?: { endpoint: string };
  };
  /**
   * The provider registry (add-provider-registry). With it, voice ids resolve through the catalog:
   * retired ids play their replacement and deprecated or retired use is recorded. Until the
   * registry tables exist it is the JSON file the fonoster-registry utility writes.
   */
  registry?: { file: string };
  /** Keepalive overrides (mainly for tests). */
  keepalive?: { pingIntervalMs?: number; idleTimeoutMs?: number };
  /** Call records (add-call-record): working records, sealing and signing. */
  callRecord?: {
    dir: string;
    region: string;
    /** jku: the HTTPS URL where this region's key set is published (KEY_SET_PATH on the gateway). */
    signingKey: { kid: string; privateKeyFile: string; jku?: string };
    /** Earlier keys, still published so old records verify after rotation. */
    keyHistory?: { kid: string; publicKeyFile: string }[];
    /** How often to seal records of calls whose gateway died (default 10 s). */
    sweepIntervalMs?: number;
  };
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
    if (app.speech?.detector && !isDetectorChoice(app.speech.detector))
      problems.push(
        `app ${app.ref}: unknown detector ${app.speech.detector} (baseline, backchannel-hold, stt or a ws:// URL)`
      );
    if (
      app.speech?.patience &&
      !["low", "normal", "high"].includes(app.speech.patience)
    )
      problems.push(`app ${app.ref}: patience must be low, normal or high`);
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
  const h = config.http;
  if (h && !h.identity && !(h.accountSid && h.authToken)) {
    problems.push("http: set identity.endpoint, or accountSid and authToken");
  }
  for (const [name, p] of Object.entries(config.providers ?? {})) {
    if (p.adapter === "fake" && !config.testMode) {
      problems.push(
        `provider ${name}: the fake adapter is only available in test mode`
      );
    }
    if (p.adapter !== "fake" && !providerKey(p)) {
      problems.push(
        `provider ${name}: no credential (set credential.env or credential.value)`
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

/** The platform key of a vendor provider, if configured. */
export function providerKey(p: ProviderConfig): string | undefined {
  return (
    p.credential?.value ??
    (p.credential?.env ? process.env[p.credential.env] : undefined)
  );
}
