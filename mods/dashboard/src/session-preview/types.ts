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
 * Shapes for the session-protocol app model and the call record, taken from the specs
 * (add-voice-session-gateway "An app is a WebSocket URL, a flavor and speech defaults",
 * add-call-record "The record contains..."). The real API is not built yet; the pages talk to a
 * SessionApi so a backend adapter can replace the mock without touching them.
 */
export type Flavor = "native" | "twilio";
export type AudioCodec =
  | "pcm16-8000"
  | "pcm16-16000"
  | "pcm16-24000"
  | "pcmu-8000";
export type ListenerTrack = "inbound" | "outbound" | "both";

export type SessionApp = {
  ref: string;
  name: string;
  /** ws:// or wss:// address the gateway dials. */
  url: string;
  flavor: Flavor;
  /** Only returned when created or rotated; never on reads. */
  signingSecret?: string;
  signingSecretHint: string;
  /** Catalog ids such as "elevenlabs/rachel". */
  speech: { voice: string; language: string };
  /** Native flavor only. */
  audio: AudioCodec;
  fallback: { appRef?: string; message?: string };
  listeners: { url: string; tracks: ListenerTrack }[];
  recording: "off" | "on" | "consent";
};

export type CatalogEntry = {
  id: string;
  label: string;
  state: "active" | "deprecated";
};
export type Catalog = { voices: CatalogEntry[]; languages: CatalogEntry[] };

export type CallStatus = "sealed" | "open";

export type CallRecordSummary = {
  callRef: string;
  appRef: string;
  from: string;
  to: string;
  direction: "inbound" | "outbound";
  startedAt: string;
  durationMs: number;
  status: CallStatus;
  version: number;
};

export type SessionMessage = {
  at: number;
  source: "app" | "gateway" | "event";
  message: { type: string; [key: string]: unknown };
};

export type Turn = {
  index: number;
  side: "caller" | "agent";
  text: string;
  startMs: number;
  endMs: number;
  /** Turn decision outcome for caller turns. */
  outcome?: "ok" | "false_cutoff" | "abandoned" | "backchannel";
};

export type CallRecord = CallRecordSummary & {
  answeredAt: string;
  endedAt: string;
  endReason: string;
  turns: Turn[];
  messages: SessionMessage[];
  warnings: string[];
  recording?: { url: string; sha256: string; sizeBytes: number };
};

export type SessionApi = {
  listApps(): Promise<SessionApp[]>;
  getApp(ref: string): Promise<SessionApp | undefined>;
  saveApp(
    app: Omit<SessionApp, "signingSecretHint" | "signingSecret">
  ): Promise<SessionApp>;
  /** Returns the new secret once; takes effect immediately, with no overlap window. */
  rotateSecret(ref: string): Promise<SessionApp>;
  getCatalog(): Promise<Catalog>;
  listCalls(): Promise<CallRecordSummary[]>;
  getCall(callRef: string): Promise<CallRecord | undefined>;
};
