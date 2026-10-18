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
import { loadServiceConfig } from "@fonoster/common";
import { isAppAudioFormat } from "./audio/pcm";
import { gatewayConfigSchema } from "./configSchema";
import { isDetectorChoice } from "./turn/createDetector";
import type { ObjectStoreConfig } from "@fonoster/callrecord";

export type Protocol = "fonoster" | "twilio";

/** Full-call recording policy (call-record "Recording is applied by policy"). */
export type RecordingPolicy = "off" | "on" | "consent";
export const RECORDING_POLICIES: RecordingPolicy[] = ["off", "on", "consent"];

/** An app: a WebSocket URL, a protocol and speech defaults (voice-session, G2). */
export type AppConfig = {
  ref: string;
  url: string;
  protocol: Protocol;
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
  /** Caller and agent audio format for the fonoster protocol (default pcm16 at 16 kHz). */
  audio?: { codec: "pcm16" | "pcmu"; rate: number };
  /** The workspace that owns the app (its access key id); the Twilio protocol's AccountSid. */
  workspaceRef?: string;
  /** Numbers routed to this app (inbound). */
  numbers?: string[];
  fallback?: { app?: string; message?: string };
  /** Audio filters applied to caller audio before STT and turn detection (VS18). */
  filters?: { name: string; options?: Record<string, unknown> }[];
  /** Listen-only sockets dialed for every session of this app (signed with its secret). */
  listeners?: { url: string; tracks?: "inbound" | "outbound" | "both" }[];
  /**
   * Set for tenant apps (from the database): their URL and listeners may reach public
   * addresses only, unless FONOSTER_ALLOWED_DESTINATIONS allows them (M14). Apps from the
   * operator's YAML, and the hosted Autopilot URL of Autopilot apps, are not checked.
   */
  publicDestinationsOnly?: { url: boolean; listeners: boolean };
  /** Recording policy for this app; overrides the workspace's and the region default. */
  recording?: RecordingPolicy;
  /**
   * Answering-machine detection (add-media-node 4.3): `true`, or `{windowMs}` of caller audio to
   * classify from when the caller starts speaking (default 4000). The session gets one
   * `amd.result` event.
   */
  amd?: boolean | { enabled?: boolean; windowMs?: number };
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
  /**
   * user/password: the gateway's NATS user when the server has per-service users (add-platform
   * 4.1); password is usually a secret:// reference.
   */
  nats: { url: string; user?: string; password?: string };
  /**
   * The RTP leg to the media node. `srtp: true` encrypts it (SDES keys in participant.add,
   * AES_CM_128_HMAC_SHA1_80); required when the node runs with -require-encryption (MN6).
   */
  rtp?: {
    host?: string;
    advertiseHost?: string;
    /** Environment variable with the advertised host when advertiseHost is unset (Helm: POD_IP). */
    advertiseHostEnv?: string;
    srtp?: boolean;
  };
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
   * Identity; otherwise the single accountSid/authToken pair applies (self-hosting). Either way it
   * ends only calls whose app's `workspaceRef` is the URL's AccountSid, so in self-hosting mode set
   * the apps' `workspaceRef` to `accountSid`.
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
    /** A client generated from the apiserver schema (default `@prisma/client`). */
    clientModule?: string;
  };
  /**
   * Workspace vendor keys from the database (registry 3.2): a workspace's own key for a provider
   * (named as in `providers`) replaces the platform key for its calls. Needs `database` with the
   * encryption key. Keys are reused for `cacheMs` (default 30 s).
   */
  workspaceKeys?: { enabled: boolean; cacheMs?: number };
  /**
   * A private region's cell secrets (add-private-regions PR-4): provider keys set on the cell with
   * `fonoster-region secrets set <provider>`, by provider name. They come before the database's
   * workspace keys, and providers need no platform credential when this is set.
   */
  cellSecrets?: {
    file?: string;
    dir?: string;
    keyEnv?: string;
    /**
     * Public regions (PR-20): a workspace's own key is fetched per call from the cloud through the
     * region agent (`cell.workspacekeys.get` on this gateway's NATS) before the region's keys.
     */
    workspaceKeysFromCloud?: boolean;
  };
  /** Where apps come from: `yaml` (the `apps` list, default) or `database` (applications rows). */
  appStore?: { source: "yaml" | "database"; cacheMs?: number };
  /**
   * Workspace webhooks (add-workspace-webhooks). `transport: database` (default) delivers from
   * here using the database's endpoints; `transport: bus` only publishes events on NATS
   * (`webhooks.events`) for the control plane's fan-out and needs no database (LO-B1).
   */
  webhooks?: {
    enabled: boolean;
    transport?: "database" | "bus";
    /** How often due deliveries are attempted (default 1 s). */
    intervalMs?: number;
    /** How often endpoints are reloaded and orphaned deliveries adopted (default 30 s). */
    refreshMs?: number;
    /** Plain http:// endpoints (tests only). */
    allowInsecureUrls?: boolean;
    /** Private destinations endpoints may use (default FONOSTER_ALLOWED_DESTINATIONS, RV-B2). */
    allowedDestinations?: string[];
  };
  /** Keepalive overrides (mainly for tests). */
  keepalive?: { pingIntervalMs?: number; idleTimeoutMs?: number };
  /** Call records (add-call-record): working records, sealing and signing. */
  /**
   * The AMD classifier (mods/amd's model, on by default, loaded on the first AMD call); apps opt
   * in with `amd`. `enabled: false` makes every verdict `unknown` / `no_classifier`.
   */
  amd?: { enabled?: boolean; modelDir?: string };
  callRecord?: {
    dir: string;
    region: string;
    /**
     * The region's signing key: `dir`, a key directory managed with `fonoster-callrecord keys
     * rotate` (rotation without restart), or one fixed key (`kid` + `privateKeyFile`). jku: the
     * HTTPS URL where this region's key set is published (KEY_SET_PATH on the gateway).
     */
    signingKey: {
      kid?: string;
      privateKeyFile?: string;
      dir?: string;
      jku?: string;
    };
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
    /**
     * Analytics (task 6.1, optional): every sealed version's redacted copy is loaded into
     * ClickHouse (docs-site/self-hosting/send-call-metrics-to-clickhouse).
     */
    analytics?: {
      clickhouse: {
        url: string;
        database?: string;
        table?: string;
        /** Usually placeholders, e.g. "${CLICKHOUSE_USER}" and "${CLICKHOUSE_PASSWORD}". */
        user?: string;
        password?: string;
      };
    };
  };
  /**
   * The apiserver's encryption key (fonoster.yaml `encryption.key`): app signing secrets, webhook
   * secrets and workspace vendor keys are encrypted columns. Usually "${ENCRYPTION_KEY}".
   */
  encryption?: { key: string };
  /** OTLP export (empty = off): `otlpEndpoint: "${OTEL_EXPORTER_OTLP_ENDPOINT:-}"`. */
  telemetry?: { otlpEndpoint?: string };
  /**
   * Browser test calls (add-talk-in-browser D4): calls with `X-Connect-Token` are answered only
   * when the token verifies with this RS256 public key (Identity's) and names the app's workspace.
   */
  testCalls?: { publicKeyFile?: string };
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
    if (!["fonoster", "twilio"].includes(app.protocol))
      problems.push(
        (app as { flavor?: unknown }).flavor !== undefined
          ? `app ${app.ref}: flavor was renamed to protocol (fonoster or twilio)`
          : `app ${app.ref}: unknown protocol ${app.protocol}`
      );
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
    if (app.audio && !isAppAudioFormat(app.audio))
      problems.push(
        `app ${app.ref}: audio must be pcm16 at 8000, 16000 or 24000 Hz, or pcmu at 8000 Hz`
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
    config.webhooks?.enabled &&
      config.webhooks.transport !== "bus" &&
      "webhooks",
    config.workspaceKeys?.enabled && "workspaceKeys"
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
  if (
    cr &&
    !cr.signingKey?.dir &&
    !(cr.signingKey?.kid && cr.signingKey?.privateKeyFile)
  )
    problems.push("callRecord.signingKey: set dir, or kid and privateKeyFile");
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
    // Without a platform key a provider still serves workspaces that saved their own key
    // (workspaceKeys, cellSecrets): a self-hosted install starts with no vendor keys.
    if (
      p.adapter !== "fake" &&
      !providerKey(p) &&
      !config.cellSecrets &&
      !config.workspaceKeys?.enabled
    ) {
      problems.push(
        `provider ${name}: no credential (set credential.env or credential.value)`
      );
    }
  }
  return problems;
}

/** Where the gateway looks for gateway.yaml when no file is named. */
export const GATEWAY_CONFIG_DIRS = ["/config", "/etc/fonoster", "./config"];

/**
 * Loads the gateway's config (one file per service, PL5) the apiserver's way: `${VAR}`
 * placeholders from the container environment, `secret://` references, then strict validation
 * (unify-config-placeholders). Without `file`, the first of GATEWAY_CONFIG_DIRS holding a
 * gateway.yaml (or .yml/.json/.jsonc) is used.
 */
export function loadConfig(
  file?: string,
  env: Record<string, string | undefined> = process.env
): GatewayConfig {
  const config = loadServiceConfig({
    service: "gateway",
    schema: gatewayConfigSchema,
    argv: file ? ["--config", file] : [],
    env,
    searchDirs: GATEWAY_CONFIG_DIRS,
    interpolatePaths: ["*"]
  }) as GatewayConfig;
  const envHost = config.rtp?.advertiseHostEnv;
  if (config.rtp && envHost && !config.rtp.advertiseHost)
    config.rtp.advertiseHost = process.env[envHost] || undefined;
  const problems = validateConfig(config);
  if (problems.length)
    throw new Error(
      `invalid gateway config ${file ?? "gateway.yaml"}:\n  - ${problems.join("\n  - ")}`
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
