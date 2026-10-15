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
import type { ObjectStoreConfig } from "@fonoster/callrecord";

export type Flavor = "native" | "twilio";

/** Full-call recording policy (call-record "Recording is applied by policy"). */
export type RecordingPolicy = "off" | "on" | "consent";
export const RECORDING_POLICIES: RecordingPolicy[] = ["off", "on", "consent"];

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
    /** STT model catalog id (e.g. `deepgram/nova-3`); default: the deployment's STT provider. */
    sttModel?: string;
    /** Words to bias recognition toward (names, brands); sent on every STT stream. */
    hints?: string[];
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
  /** Recording policy for this app; overrides the workspace's and the region default. */
  recording?: RecordingPolicy;
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
  /**
   * The RTP leg to the media node. `srtp: true` encrypts it (SDES keys in participant.add,
   * AES_CM_128_HMAC_SHA1_80); required when the node runs with -require-encryption (MN6).
   */
  rtp?: { host?: string; advertiseHost?: string; srtp?: boolean };
  /** Apps when `appStore.source` is yaml (the default). */
  apps?: AppConfig[];
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
  registry?: {
    file?: string;
    /** `database`: the registry tables (needs `database`); refreshed every refreshMs (30 s). */
    source?: "file" | "database";
    refreshMs?: number;
  };
  /**
   * The control-plane database (the apiserver's), for `apps.source: database`, database registry
   * and webhooks. The gateway only reads apps and the catalog; it writes webhook deliveries.
   */
  database?: {
    url?: string;
    /** Environment variable holding the URL (default APISERVER_DATABASE_URL). */
    urlEnv?: string;
    /** Environment variable with the apiserver's encryption key (app signing secrets, webhooks). */
    encryptionKeyEnv?: string;
    /** A client generated from the apiserver schema (default `@prisma/client`). */
    clientModule?: string;
  };
  /** Where apps come from: `yaml` (the `apps` list, default) or `database` (applications rows). */
  appStore?: { source: "yaml" | "database"; cacheMs?: number };
  /** Workspace webhooks (add-workspace-webhooks) from the database's endpoints. */
  webhooks?: {
    enabled: boolean;
    /** How often due deliveries are attempted (default 1 s). */
    intervalMs?: number;
    /** How often endpoints are reloaded and orphaned deliveries adopted (default 30 s). */
    refreshMs?: number;
    /** Plain http:// endpoints (tests only). */
    allowInsecureUrls?: boolean;
  };
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
    /**
     * The region's object storage for sealed records and recordings (default: `<dir>/sealed` on
     * disk, for development). `{s3: {bucket, endpoint, ...}}` for S3-compatible storage.
     */
    store?: ObjectStoreConfig;
    /** Recording policy when neither the app nor its workspace sets one (default off). */
    recording?: RecordingPolicy;
    /** Per-workspace settings: recording policy and the workspace's own bucket. */
    workspaces?: Record<
      string,
      { recording?: RecordingPolicy; store?: ObjectStoreConfig }
    >;
    /** What the caller hears before recording starts under the `consent` policy (O6, interim). */
    consentPrompt?: string;
    /** Base URL of the records API, for the link in `call_record.sealed` (default /api/records). */
    recordUrl?: string;
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
    if (app.speech?.sttModel && !/^[a-z0-9-]+\/.+/.test(app.speech.sttModel))
      problems.push(
        `app ${app.ref}: sttModel must be a catalog id like deepgram/nova-3`
      );
    if (
      app.speech?.hints &&
      (!Array.isArray(app.speech.hints) ||
        app.speech.hints.some((h) => typeof h !== "string"))
    )
      problems.push(`app ${app.ref}: hints must be a list of strings`);
    if (app.recording && !RECORDING_POLICIES.includes(app.recording))
      problems.push(
        `app ${app.ref}: unknown recording policy ${app.recording}`
      );
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
  const needsDb = [
    config.appStore?.source === "database" && "appStore.source: database",
    config.registry?.source === "database" && "registry.source: database",
    config.webhooks?.enabled && "webhooks"
  ].filter(Boolean);
  if (needsDb.length && !databaseUrl(config))
    problems.push(`${needsDb.join(", ")} need database.url or database.urlEnv`);
  if (
    config.registry &&
    config.registry.source !== "database" &&
    !config.registry.file
  )
    problems.push("registry: set file, or source: database");
  if (config.appStore && !["yaml", "database"].includes(config.appStore.source))
    problems.push(`appStore: unknown source ${config.appStore.source}`);
  const cr = config.callRecord;
  for (const policy of [
    cr?.recording,
    ...Object.values(cr?.workspaces ?? {}).map((w) => w.recording)
  ])
    if (policy && !RECORDING_POLICIES.includes(policy))
      problems.push(`callRecord: unknown recording policy ${policy}`);
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

/** The control-plane database URL, if configured. */
export function databaseUrl(config: GatewayConfig): string | undefined {
  const d = config.database;
  if (!d) return undefined;
  return d.url ?? process.env[d.urlEnv ?? "APISERVER_DATABASE_URL"];
}

/** The recording policy for a call: the app's, else its workspace's, else the region default. */
export function recordingPolicy(
  config: GatewayConfig,
  app: AppConfig
): RecordingPolicy {
  return (
    app.recording ??
    (app.workspaceRef
      ? config.callRecord?.workspaces?.[app.workspaceRef]?.recording
      : undefined) ??
    config.callRecord?.recording ??
    "off"
  );
}
