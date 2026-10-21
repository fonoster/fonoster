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
/**
 * What the app, call-record, webhook and vendor-key pages work with. SessionApi is implemented by
 * the SDK adapter (./sdk-api.ts) against the apiserver, and by an in-memory mock (./mock-api.ts)
 * for tests and stories.
 */
export type Protocol = "fonoster" | "twilio";
export type AppType = "STREAM" | "AUTOPILOT";
export type AudioCodec =
  | "pcm16-8000"
  | "pcm16-16000"
  | "pcm16-24000"
  | "pcmu-8000";
export type ListenerTrack = "inbound" | "outbound" | "both";
export type Patience = "" | "low" | "normal" | "high";
/** "" inherits the workspace's policy. */
export type RecordingPolicy = "" | "off" | "on" | "consent";

/** One audio filter of an app, as the API stores it. */
export type AudioFilterSetting = {
  name: string;
  options?: Record<string, unknown>;
};

export type SessionApp = {
  /** Empty for an app not saved yet. */
  ref: string;
  name: string;
  type: AppType;
  /** ws:// or wss:// address AppBridge dials (Autopilot apps: the hosted Autopilot). */
  url: string;
  protocol: Protocol;
  /** Only returned when created or rotated; never on reads. */
  signingSecret?: string;
  signingSecretHint: string;
  /** Catalog ids such as "elevenlabs/rachel". */
  speech: {
    voice: string;
    language: string;
    sttModel?: string;
    patience?: Patience;
  };
  /** Fonoster protocol only. */
  audio: AudioCodec;
  fallback: { appRef?: string; message?: string };
  listeners: { url: string; tracks: ListenerTrack }[];
  recording: RecordingPolicy;
  /** Answering-machine detection (AO-B1); the window is kept as the API has it. */
  amd?: boolean;
  amdWindowMs?: number;
  /** Audio filters on the caller's audio (noise cancelling); empty or absent: none. */
  filters?: AudioFilterSetting[];
  /** Autopilot apps: the agent (sessionAgentSchema), as JSON. */
  agent?: Record<string, unknown>;
};

export type CatalogEntry = {
  id: string;
  label: string;
  state: "active" | "deprecated";
  /** Deprecated entries: what to use instead. */
  replacement?: string;
  /** Models and voices: languages served ("multi" = any); empty = not stated. */
  languages?: string[];
  /** Models: catalog features (streaming, tool-calling, …). */
  features?: string[];
  /** Voices: the TTS models the voice exists on. */
  models?: string[];
  /** Set by the pickers on a saved value that no longer fits the other settings. */
  incompatible?: boolean;
  /** Providers: needs no key (the fakes, local models). */
  keyless?: boolean;
  /** Providers: what they serve (stt, tts, llm, nc). */
  capabilities?: string[];
};
export type Catalog = {
  voices: CatalogEntry[];
  languages: CatalogEntry[];
  sttModels: CatalogEntry[];
  ttsModels: CatalogEntry[];
  llmModels: CatalogEntry[];
  /** Provider ids (for vendor keys). */
  providers: CatalogEntry[];
};

/** A deprecated or retired catalog item the workspace uses (registry warnings, LO-B11). */
export type CatalogWarning = {
  id: string;
  kind: "provider" | "model" | "voice";
  state: "deprecated" | "retired";
  replacement?: string;
  retireOn?: string;
  /** Saved apps and agents that name it (and, for a TTS model, the voice they use). */
  usedBy: {
    kind: "app" | "agent";
    ref: string;
    name: string;
    field: string;
    voice?: string;
  }[];
  /** Apps whose calls used it lately, including ids no saved app names. */
  runtimeApps: string[];
  runtimeSessions: number;
  lastUsedAt?: string;
};

/** A phone number as the app pages show it (routing lives on the number). */
export type AppNumber = {
  ref: string;
  telUrl: string;
  appRef?: string;
  trunkName?: string;
};

export type CallStatus = string;

export type CallRecordSummary = {
  callRef: string;
  appRef: string;
  from: string;
  to: string;
  direction: string;
  startedAt: string;
  durationMs: number;
  /** completed, failed, incomplete, erased */
  status: CallStatus;
  version: number;
};

export type CallFilter = {
  status?: string;
  /** ISO time: only calls that started after it. */
  after?: string;
  appRef?: string;
  pageToken?: string;
};

export type CallPage = { items: CallRecordSummary[]; nextPageToken?: string };

export type SessionMessage = {
  at: number;
  source: "app" | "appbridge" | "event";
  message: { type: string; [key: string]: unknown };
};

export type Turn = {
  index: number;
  side: "caller" | "agent";
  text: string;
  startMs: number;
  endMs: number;
  /** Turn decision outcome for caller turns; interrupted agent turns. */
  outcome?: "ok" | "false_cutoff" | "abandoned" | "backchannel" | "interrupted";
};

export type CallRecord = CallRecordSummary & {
  endedAt: string;
  endReason: string;
  redacted: boolean;
  turns: Turn[];
  /** Turn decisions and app notes, in time order. */
  messages: SessionMessage[];
  warnings: string[];
  /** Why a call that never reached an app failed, with the SIP status when there was one. */
  failure?: { reason: string; sipStatus?: number };
  /** Audio filters that failed: the call ran unfiltered (badge on the detail). */
  unfiltered?: { name?: string; reason: string }[];
  recording?: { url?: string; sha256?: string; sizeBytes?: number };
};

export type WebhookEventType =
  | "call.started"
  | "call.ended"
  | "call.failed"
  | "call_record.sealed"
  | "provider.deprecated";

export type Webhook = {
  ref: string;
  url: string;
  events: string[];
  secretHint: string;
  /** Until when the previous secret still verifies (after a rotation). */
  previousSecretUntil?: string;
  createdAt?: string;
};

export type WebhookDelivery = {
  ref: string;
  webhookRef: string;
  eventId: string;
  eventType: string;
  status: string;
  attempts: number;
  lastStatus?: number;
  createdAt?: string;
};

export type VendorKey = { providerId: string; updatedAt?: string };

export type SessionApi = {
  listApps(): Promise<SessionApp[]>;
  getApp(ref: string): Promise<SessionApp | undefined>;
  /** Creates (no ref) or replaces an app; a new app comes back with its secret, once. */
  saveApp(
    app: Omit<SessionApp, "signingSecretHint" | "signingSecret">
  ): Promise<SessionApp>;
  /** Returns the new secret once; takes effect immediately, with no overlap window. */
  rotateSecret(ref: string): Promise<SessionApp>;
  deleteApp(ref: string): Promise<void>;
  getCatalog(): Promise<Catalog>;
  /** Deprecated or retired catalog items this workspace uses, and where. */
  listCatalogWarnings(): Promise<CatalogWarning[]>;
  /** The workspace's numbers; an app is reachable at the ones whose appRef points to it. */
  listNumbers(): Promise<AppNumber[]>;
  /** One page of the workspace's records, newest first (the records API's search). */
  listCalls(filter?: CallFilter): Promise<CallPage>;
  /** The record; "erased" when it was erased, undefined when there is none. */
  getCall(callRef: string): Promise<CallRecord | "erased" | undefined>;
  /** The recording as a downloadable object URL (the API needs the access token). */
  recordingUrl(callRef: string): Promise<string>;
  listWebhooks(): Promise<Webhook[]>;
  /** Returns the new endpoint's secret, shown once. */
  createWebhook(input: {
    url: string;
    events: string[];
  }): Promise<{ ref: string; secret: string }>;
  /** Changes the URL and events; the signing secret stays the same. */
  updateWebhook(input: {
    ref: string;
    url: string;
    events: string[];
  }): Promise<void>;
  deleteWebhook(ref: string): Promise<void>;
  /** The previous secret keeps verifying for 24 hours. */
  rotateWebhookSecret(ref: string): Promise<{ secret: string }>;
  listDeliveries(webhookRef?: string): Promise<WebhookDelivery[]>;
  resendDelivery(ref: string): Promise<WebhookDelivery>;
  listVendorKeys(): Promise<VendorKey[]>;
  setVendorKey(providerId: string, key: string): Promise<void>;
  deleteVendorKey(providerId: string): Promise<void>;
};
