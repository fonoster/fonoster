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
import { FromSchema } from "json-schema-to-ts";

// The fonoster.session.v1 messages (native flavor), as JSON Schema. These schemas are the source
// of truth: TypeScript types are derived from them below, and schema/session.v1.json is exported
// from them for other languages (see scripts/export-session-schema.ts).
//
// Every schema allows extra fields: both sides ignore unknown fields (voice-session, "Message
// envelope and versioning"), so the protocol only grows.

export const SESSION_PROTOCOL = "fonoster.session.v1";

const id = { type: "string", minLength: 1, maxLength: 128 } as const;
const catalogId = { type: "string", minLength: 1 } as const;

// ---- gateway → app ---------------------------------------------------------------------

export const sessionStartSchema = {
  type: "object",
  required: [
    "type",
    "protocol",
    "sessionRef",
    "callRef",
    "appRef",
    "direction",
    "from",
    "to",
    "metadata",
    "handoff",
    "audio",
    "tracks",
    "speech"
  ],
  properties: {
    type: { const: "session.start" },
    protocol: { const: SESSION_PROTOCOL },
    sessionRef: { type: "string" },
    callRef: { type: "string" },
    appRef: { type: "string" },
    direction: { enum: ["inbound", "outbound"] },
    from: { type: "string" },
    to: { type: "string" },
    metadata: { type: "object" },
    handoff: { oneOf: [{ type: "null" }, { type: "object" }] },
    audio: {
      type: "object",
      required: ["codec", "rate"],
      properties: {
        codec: { enum: ["pcm16", "pcmu", "opus"] },
        rate: { type: "integer" }
      }
    },
    tracks: {
      type: "array",
      items: {
        type: "object",
        required: ["id", "side", "kind", "codec"],
        properties: {
          id: { type: "integer", minimum: 0, maximum: 255 },
          side: { enum: ["inbound", "outbound"] },
          kind: { enum: ["audio"] },
          codec: { type: "string" }
        }
      }
    },
    speech: {
      type: "object",
      required: ["voice", "language"],
      properties: { voice: { type: "string" }, language: { type: "string" } }
    }
  }
} as const;

export const SESSION_END_REASONS = [
  "caller_hangup",
  "app_hangup",
  "transfer",
  "handoff",
  "error",
  "timeout"
] as const;

export const sessionEndSchema = {
  type: "object",
  required: ["type", "reason"],
  properties: {
    type: { const: "session.end" },
    reason: { enum: SESSION_END_REASONS }
  }
} as const;

export const ERROR_CODES = [
  "bad_message",
  "unknown_command",
  "read_only",
  "not_supported_by_flavor",
  "provider_unavailable",
  "provider_timeout",
  "invalid_catalog_id",
  "feature_not_supported",
  "transfer_failed",
  "on_hold",
  "queue_full",
  "play_fetch_failed",
  "internal"
] as const;

export const errorSchema = {
  type: "object",
  required: ["type", "code", "message", "fatal"],
  properties: {
    type: { const: "error" },
    code: { type: "string" },
    message: { type: "string" },
    fatal: { type: "boolean" },
    relatesTo: id
  }
} as const;

export const turnUserStartedSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "turn.user_started" } }
} as const;

export const turnLikelyEndedSchema = {
  type: "object",
  required: ["type", "text"],
  properties: { type: { const: "turn.likely_ended" }, text: { type: "string" } }
} as const;

export const turnEndedSchema = {
  type: "object",
  required: ["type", "text", "language", "confidence", "durationMs"],
  properties: {
    type: { const: "turn.ended" },
    text: { type: "string" },
    language: { type: "string" },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    durationMs: { type: "number", minimum: 0 },
    /** No speech followed turn.user_started for 10 s (noise, a dropped line). */
    abandoned: { type: "boolean" }
  }
} as const;

export const turnResumedSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "turn.resumed" } }
} as const;

export const turnBackchannelSchema = {
  type: "object",
  required: ["type", "text"],
  properties: { type: { const: "turn.backchannel" }, text: { type: "string" } }
} as const;

export const turnEstimateSchema = {
  type: "object",
  required: ["type", "eot", "speaking", "kind"],
  properties: {
    type: { const: "turn.estimate" },
    eot: { type: "number", minimum: 0, maximum: 1 },
    speaking: { type: "boolean" },
    kind: { enum: ["speech", "backchannel", "interruption", "none"] }
  }
} as const;

export const transcriptPartialSchema = {
  type: "object",
  required: ["type", "text"],
  properties: {
    type: { const: "transcript.partial" },
    text: { type: "string" },
    language: { type: "string" }
  }
} as const;

export const outputStartedSchema = {
  type: "object",
  required: ["type", "id"],
  properties: { type: { const: "output.started" }, id }
} as const;

export const outputDoneSchema = {
  type: "object",
  required: ["type", "id"],
  properties: {
    type: { const: "output.done" },
    id,
    heardMs: { type: "number", minimum: 0 }
  }
} as const;

export const outputInterruptedSchema = {
  type: "object",
  required: ["type", "id", "heardText", "heardMs"],
  properties: {
    type: { const: "output.interrupted" },
    id,
    heardText: { type: "string" },
    heardMs: { type: "number", minimum: 0 }
  }
} as const;

export const markEventSchema = {
  type: "object",
  required: ["type", "name", "cleared"],
  properties: {
    type: { const: "mark" },
    name: { type: "string" },
    cleared: { type: "boolean" }
  }
} as const;

export const dtmfEventSchema = {
  type: "object",
  required: ["type", "digit"],
  properties: {
    type: { const: "dtmf" },
    digit: { type: "string", pattern: "^[0-9A-D*#]$" }
  }
} as const;

/** Answering-machine detection, once per call, for apps with `amd` (add-media-node 4.3). */
export const amdResultSchema = {
  type: "object",
  required: ["type", "status", "confidence", "detector", "audioMs"],
  properties: {
    type: { const: "amd.result" },
    status: { enum: ["human", "voicemail", "ivr", "machine", "unknown"] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    detector: { type: "string" },
    /** How much caller audio the verdict is based on. */
    audioMs: { type: "number", minimum: 0 },
    /** Why detection could not run (status unknown): no_audio, no_classifier, call_ended, … */
    reason: { type: "string" }
  }
} as const;

// ---- app → gateway ---------------------------------------------------------------------

export const speakSchema = {
  type: "object",
  required: ["type", "text"],
  properties: {
    type: { const: "speak" },
    id,
    text: { type: "string" },
    last: { type: "boolean" },
    voice: catalogId,
    language: catalogId,
    interruptible: { type: "boolean" },
    preempt: { type: "boolean" }
  }
} as const;

export const playSchema = {
  type: "object",
  required: ["type", "url"],
  properties: {
    type: { const: "play" },
    id,
    url: { type: "string", pattern: "^https?://" },
    loop: { type: "boolean" },
    interruptible: { type: "boolean" },
    preempt: { type: "boolean" }
  }
} as const;

export const listenUpdateSchema = {
  type: "object",
  required: ["type"],
  properties: {
    type: { const: "listen.update" },
    id,
    language: catalogId,
    hints: { type: "array", items: { type: "string" } },
    /** How long the Turn Detector waits before turn.ended. */
    patience: { enum: ["low", "normal", "high"] }
  }
} as const;

export const SUBSCRIBABLE_EVENTS = [
  "turn.estimate",
  "transcript.partial"
] as const;

export const subscribeSchema = {
  type: "object",
  required: ["type", "events"],
  properties: {
    type: { const: "subscribe" },
    id,
    events: { type: "array", items: { type: "string" } }
  }
} as const;

export const markCommandSchema = {
  type: "object",
  required: ["type", "name"],
  properties: {
    type: { const: "mark" },
    name: { type: "string", minLength: 1 }
  }
} as const;

export const clearSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "clear" }, id }
} as const;

export const hangupSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "hangup" }, id }
} as const;

export const dtmfSendSchema = {
  type: "object",
  required: ["type", "digits"],
  properties: {
    type: { const: "dtmf.send" },
    id,
    digits: { type: "string", pattern: "^[0-9A-D*#w]+$" }
  }
} as const;

export const TRANSFER_MODES = ["cold", "warm", "refer"] as const;

export const transferSchema = {
  type: "object",
  required: ["type", "to"],
  properties: {
    type: { const: "transfer" },
    id,
    to: { type: "string", minLength: 1 },
    headers: { type: "object", additionalProperties: { type: "string" } },
    mode: { enum: TRANSFER_MODES },
    /** Warm transfers: what the caller hears while waiting. */
    music: { type: "string" }
  }
} as const;

export const transferCompleteSchema = {
  type: "object",
  required: ["type", "id"],
  properties: { type: { const: "transfer.complete" }, id }
} as const;

export const holdSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "hold" }, id, music: { type: "string" } }
} as const;

export const resumeSchema = {
  type: "object",
  required: ["type"],
  properties: { type: { const: "resume" }, id }
} as const;

export const handoffSchema = {
  type: "object",
  required: ["type", "app"],
  properties: {
    type: { const: "handoff" },
    id,
    app: { type: "string", minLength: 1 },
    payload: { type: "object" }
  }
} as const;

export const recordNoteSchema = {
  type: "object",
  required: ["type", "data"],
  properties: {
    type: { const: "record.note" },
    id,
    data: { type: "object" }
  }
} as const;

// ---- types -----------------------------------------------------------------------------

export type SessionStart = FromSchema<typeof sessionStartSchema>;
export type SessionEnd = FromSchema<typeof sessionEndSchema>;
export type SessionEndReason = (typeof SESSION_END_REASONS)[number];
export type SessionError = FromSchema<typeof errorSchema>;
export type ErrorCode = (typeof ERROR_CODES)[number];
export type TurnUserStarted = FromSchema<typeof turnUserStartedSchema>;
export type TurnLikelyEnded = FromSchema<typeof turnLikelyEndedSchema>;
export type TurnEnded = FromSchema<typeof turnEndedSchema>;
export type TurnResumed = FromSchema<typeof turnResumedSchema>;
export type TurnBackchannel = FromSchema<typeof turnBackchannelSchema>;
export type TurnEstimate = FromSchema<typeof turnEstimateSchema>;
export type TranscriptPartial = FromSchema<typeof transcriptPartialSchema>;
export type OutputStarted = FromSchema<typeof outputStartedSchema>;
export type OutputDone = FromSchema<typeof outputDoneSchema>;
export type OutputInterrupted = FromSchema<typeof outputInterruptedSchema>;
export type MarkEvent = FromSchema<typeof markEventSchema>;
export type DtmfEvent = FromSchema<typeof dtmfEventSchema>;
export type AmdResult = FromSchema<typeof amdResultSchema>;

export type Speak = FromSchema<typeof speakSchema>;
export type Play = FromSchema<typeof playSchema>;
export type ListenUpdate = FromSchema<typeof listenUpdateSchema>;
export type Subscribe = FromSchema<typeof subscribeSchema>;
export type MarkCommand = FromSchema<typeof markCommandSchema>;
export type Clear = FromSchema<typeof clearSchema>;
export type Hangup = FromSchema<typeof hangupSchema>;
export type DtmfSend = FromSchema<typeof dtmfSendSchema>;
export type Transfer = FromSchema<typeof transferSchema>;
export type TransferMode = (typeof TRANSFER_MODES)[number];
export type TransferComplete = FromSchema<typeof transferCompleteSchema>;
export type Hold = FromSchema<typeof holdSchema>;
export type Resume = FromSchema<typeof resumeSchema>;
export type Handoff = FromSchema<typeof handoffSchema>;
export type RecordNote = FromSchema<typeof recordNoteSchema>;

export type GatewayMessage =
  | SessionStart
  | SessionEnd
  | SessionError
  | TurnUserStarted
  | TurnLikelyEnded
  | TurnEnded
  | TurnResumed
  | TurnBackchannel
  | TurnEstimate
  | TranscriptPartial
  | OutputStarted
  | OutputDone
  | OutputInterrupted
  | MarkEvent
  | DtmfEvent
  | AmdResult;

export type AppCommand =
  | Speak
  | Play
  | ListenUpdate
  | Subscribe
  | MarkCommand
  | Clear
  | Hangup
  | DtmfSend
  | Transfer
  | TransferComplete
  | Hold
  | Resume
  | Handoff
  | RecordNote;

/** Schemas by message type, per direction. "mark" exists in both directions. */
export const GATEWAY_MESSAGE_SCHEMAS = {
  "session.start": sessionStartSchema,
  "session.end": sessionEndSchema,
  error: errorSchema,
  "turn.user_started": turnUserStartedSchema,
  "turn.likely_ended": turnLikelyEndedSchema,
  "turn.ended": turnEndedSchema,
  "turn.resumed": turnResumedSchema,
  "turn.backchannel": turnBackchannelSchema,
  "turn.estimate": turnEstimateSchema,
  "transcript.partial": transcriptPartialSchema,
  "output.started": outputStartedSchema,
  "output.done": outputDoneSchema,
  "output.interrupted": outputInterruptedSchema,
  mark: markEventSchema,
  dtmf: dtmfEventSchema,
  "amd.result": amdResultSchema
} as const;

export const APP_COMMAND_SCHEMAS = {
  speak: speakSchema,
  play: playSchema,
  "listen.update": listenUpdateSchema,
  subscribe: subscribeSchema,
  mark: markCommandSchema,
  clear: clearSchema,
  hangup: hangupSchema,
  "dtmf.send": dtmfSendSchema,
  transfer: transferSchema,
  "transfer.complete": transferCompleteSchema,
  hold: holdSchema,
  resume: resumeSchema,
  handoff: handoffSchema,
  "record.note": recordNoteSchema
} as const;

export type AppCommandType = keyof typeof APP_COMMAND_SCHEMAS;
export type GatewayMessageType = keyof typeof GATEWAY_MESSAGE_SCHEMAS;

/** The whole protocol as one JSON Schema document, as exported to schema/session.v1.json. */
export function sessionProtocolDocument() {
  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://fonoster.com/schemas/session/v1.json",
    title: SESSION_PROTOCOL,
    description:
      "Messages of the Fonoster session protocol, native flavor. Unknown types and fields must be ignored.",
    protocol: SESSION_PROTOCOL,
    gatewayToApp: GATEWAY_MESSAGE_SCHEMAS,
    appToGateway: APP_COMMAND_SCHEMAS
  };
}
