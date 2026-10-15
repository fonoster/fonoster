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
import type {
  CallRecord,
  CallRecordSummary,
  Catalog,
  SessionApi,
  SessionApp
} from "./types";

export const catalog: Catalog = {
  voices: [
    { id: "elevenlabs/rachel", label: "ElevenLabs Rachel", state: "active" },
    { id: "elevenlabs/adam", label: "ElevenLabs Adam", state: "active" },
    {
      id: "deepgram/aura-asteria",
      label: "Deepgram Aura Asteria",
      state: "deprecated"
    }
  ],
  languages: [
    { id: "en-US", label: "English (US)", state: "active" },
    { id: "es-419", label: "Spanish (Latin America)", state: "active" },
    { id: "multi", label: "Multilingual", state: "active" }
  ]
};

const seedApps = (): SessionApp[] => [
  {
    ref: "support-line",
    name: "Support line",
    url: "wss://bot.example.com/agent",
    flavor: "native",
    signingSecretHint: "…a91c",
    speech: { voice: "elevenlabs/rachel", language: "en-US" },
    audio: "pcm16-16000",
    fallback: { message: "We are having trouble. Please call back soon." },
    listeners: [{ url: "wss://monitor.example.com/listen", tracks: "both" }],
    recording: "on"
  },
  {
    ref: "pipecat-bot",
    name: "Pipecat bot",
    url: "wss://pipecat.example.com/ws",
    flavor: "twilio",
    signingSecretHint: "…77e0",
    speech: { voice: "elevenlabs/adam", language: "multi" },
    audio: "pcmu-8000",
    fallback: { appRef: "support-line" },
    listeners: [],
    recording: "off"
  }
];

const msg = (
  at: number,
  source: "app" | "gateway" | "event",
  message: { type: string; [key: string]: unknown }
) => ({ at, source, message });

const sampleCall = (): CallRecord => ({
  callRef: "room-1",
  appRef: "support-line",
  from: "+15550001111",
  to: "+15550002222",
  direction: "inbound",
  startedAt: "2026-10-15T14:00:00.000Z",
  answeredAt: "2026-10-15T14:00:00.200Z",
  endedAt: "2026-10-15T14:00:42.000Z",
  durationMs: 42000,
  status: "sealed",
  version: 1,
  endReason: "caller_hangup",
  warnings: ["Voice deepgram/aura-asteria is deprecated"],
  recording: {
    url: "https://example.com/recordings/room-1.wav",
    sha256: "9f2c5a7e1d0b4c8a6e3f",
    sizeBytes: 1_344_000
  },
  turns: [
    {
      index: 0,
      side: "agent",
      text: "Hi! What can I do for you?",
      startMs: 300,
      endMs: 2100
    },
    {
      index: 1,
      side: "caller",
      text: "I want to check my balance",
      startMs: 2600,
      endMs: 4800,
      outcome: "ok"
    },
    {
      index: 2,
      side: "agent",
      text: "Your balance is forty two dollars.",
      startMs: 5400,
      endMs: 7900
    },
    {
      index: 3,
      side: "caller",
      text: "uh-huh",
      startMs: 6000,
      endMs: 6300,
      outcome: "backchannel"
    },
    {
      index: 4,
      side: "caller",
      text: "thanks, bye",
      startMs: 9000,
      endMs: 10100,
      outcome: "ok"
    }
  ],
  messages: [
    msg(0, "gateway", {
      type: "session.start",
      protocol: "fonoster.session.v1",
      direction: "inbound"
    }),
    msg(310, "app", {
      type: "speak",
      id: "s1",
      text: "Hi! What can I do for you?"
    }),
    msg(420, "gateway", { type: "output.started", id: "s1" }),
    msg(2100, "gateway", { type: "output.done", id: "s1", heardMs: 1680 }),
    msg(2600, "event", { type: "turn.user_started" }),
    msg(4800, "event", {
      type: "turn.ended",
      text: "I want to check my balance",
      confidence: 0.97
    }),
    msg(5400, "app", {
      type: "speak",
      id: "s2",
      text: "Your balance is forty two dollars."
    }),
    msg(6000, "event", { type: "turn.backchannel", text: "uh-huh" }),
    msg(7900, "gateway", { type: "output.done", id: "s2", heardMs: 2500 }),
    msg(10100, "event", { type: "turn.ended", text: "thanks, bye" }),
    msg(10300, "app", { type: "hangup" }),
    msg(10400, "gateway", { type: "session.end", reason: "app_hangup" })
  ]
});

const summary = (c: CallRecord): CallRecordSummary => ({
  callRef: c.callRef,
  appRef: c.appRef,
  from: c.from,
  to: c.to,
  direction: c.direction,
  startedAt: c.startedAt,
  durationMs: c.durationMs,
  status: c.status,
  version: c.version
});

const randomSecret = () =>
  `whsec_${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

/** In-memory SessionApi so the pages render without a backend. */
export function createMockSessionApi(): SessionApi {
  const apps = new Map(seedApps().map((a) => [a.ref, a]));
  const calls = [
    sampleCall(),
    {
      ...sampleCall(),
      callRef: "room-2",
      appRef: "pipecat-bot",
      direction: "outbound" as const,
      durationMs: 9000,
      warnings: [],
      recording: undefined
    }
  ];
  return {
    listApps: async () => [...apps.values()],
    getApp: async (ref) => apps.get(ref),
    saveApp: async (input) => {
      const previous = apps.get(input.ref);
      const saved: SessionApp = {
        ...input,
        signingSecretHint: previous?.signingSecretHint ?? "…new0",
        signingSecret: previous ? undefined : randomSecret()
      };
      apps.set(saved.ref, { ...saved, signingSecret: undefined });
      return saved;
    },
    rotateSecret: async (ref) => {
      const app = apps.get(ref);
      if (!app) throw new Error(`No app ${ref}`);
      const secret = randomSecret();
      const next = { ...app, signingSecretHint: `…${secret.slice(-4)}` };
      apps.set(ref, next);
      return { ...next, signingSecret: secret };
    },
    getCatalog: async () => catalog,
    listCalls: async () => calls.map(summary),
    getCall: async (ref) => calls.find((c) => c.callRef === ref)
  };
}
