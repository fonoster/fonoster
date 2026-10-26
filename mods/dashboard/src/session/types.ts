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
  /** caller_hangup, app_hangup, …; empty while unknown. */
  endReason?: string;
  /** Why a call that never reached an app failed (busy, no_answer, rejected, …). */
  failureReason?: string;
  sipStatus?: number;
  /** Who answered, by AMD: human, voicemail, ivr, machine, unknown; absent when AMD didn't run. */
  amdStatus?: string;
  /** The trunk of the workspace's number on the call, by name; absent when unknown. */
  trunkName?: string;
};

export type CallFilter = {
  status?: string;
  /** ISO time: only calls that started after it. */
  after?: string;
  appRef?: string;
  /** inbound, outbound or internal. */
  direction?: string;
  pageToken?: string;
};

export type CallPage = {
  items: CallRecordSummary[];
  nextPageToken?: string;
  /** How many calls match the filters, on all pages; absent from older servers. */
  total?: number;
};

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
  /** Agent turns cut off by the caller: how much was heard, in ms. */
  heardMs?: number;
  /** Agent turns: from the caller's last word to the agent's first audio, in ms. */
  firstAudioMs?: number;
  /** Where that wait went, from Autopilot's turn note; records written before it have none. */
  stages?: { llmMs: number; ttsMs: number };
};

/**
 * A tool the agent called during a turn (Autopilot's autopilot.turn note). Records from before
 * #1067 have the name and outcome only; parameters, response and error are JSON text, capped and
 * redacted like the transcript.
 */
export type ToolCall = {
  at: number;
  name: string;
  ok: boolean;
  method?: string;
  status?: number;
  durationMs?: number;
  parameters?: string;
  response?: string;
  error?: string;
};

/** One passage a knowledge search found: its text, the document it came from and its score. */
export type KnowledgePassage = {
  text: string;
  source?: string;
  score?: number;
};

/** What the agent looked up in its knowledge for a turn: the query and the top passages found. */
export type KnowledgeSearch = {
  at: number;
  query: string;
  /** Best first: the first passage's `source` is the document of the top match. */
  passages: KnowledgePassage[];
  durationMs?: number;
  /** The search took too long; the answer went without it. */
  timedOut?: boolean;
  /** The search failed; the answer went without it. `error` says why, short. */
  failed?: boolean;
  error?: string;
};

/** One usage line of the call (add-usage-metering): what was used, not what it costs. */
export type UsageLine = {
  meter: string;
  quantity: number;
  provider?: string;
  model?: string;
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
  /** The AMD verdict, when AMD ran: how sure, on how much audio, and when. */
  amd?: { status: string; confidence?: number; audioMs?: number; at: number };
  toolCalls: ToolCall[];
  knowledgeSearches: KnowledgeSearch[];
  usage: UsageLine[];
  /** The vCon as the API returned it, for Export JSON. */
  vcon: unknown;
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
