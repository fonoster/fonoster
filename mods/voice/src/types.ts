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
import { SessionStart } from "@fonoster/common";

export type SayOptions = {
  voice?: string;
  language?: string;
  interruptible?: boolean;
  preempt?: boolean;
};

export type SayResult = {
  interrupted: boolean;
  heardText: string;
  heardMs: number;
};

export type PlayOptions = {
  loop?: boolean;
  interruptible?: boolean;
  preempt?: boolean;
};

export type PlayResult = { interrupted: boolean; heardMs: number };

/** "speech_and_dtmf" is the new name; "speech,dtmf" is today's GatherSource value. */
export type GatherSourceName =
  | "speech"
  | "dtmf"
  | "speech_and_dtmf"
  | "speech,dtmf";

export type GatherOptions = {
  source?: GatherSourceName;
  maxDigits?: number;
  finishOnKey?: string;
  /** ms to wait for the first input (default 4000). */
  timeout?: number;
};

export type GatherResult = { speech?: string; digits?: string };

export type TransferOptions = {
  mode?: "cold" | "warm" | "refer";
  headers?: Record<string, string>;
};

export type SessionEventMap = {
  "turn.user_started": Record<string, never>;
  "turn.likely_ended": { text: string };
  "turn.ended": {
    text: string;
    language: string;
    confidence: number;
    durationMs: number;
  };
  "turn.resumed": Record<string, never>;
  "turn.backchannel": { text: string };
  "transcript.partial": { text: string; language?: string };
  "turn.estimate": { eot: number; speaking: boolean; kind: string };
  /** Answering-machine detection, once per call, for apps with `amd` (add-roomr 4.3). */
  "amd.result": {
    status: "human" | "voicemail" | "ivr" | "machine" | "unknown";
    confidence: number;
    detector: string;
    audioMs: number;
    reason?: string;
  };
  dtmf: { digit: string };
  error: { code: string; message: string; fatal: boolean };
  end: { reason: string };
};

export type SessionEventName = keyof SessionEventMap;

export type SessionInfo = Pick<
  SessionStart,
  | "sessionRef"
  | "callRef"
  | "appRef"
  | "direction"
  | "from"
  | "to"
  | "metadata"
  | "handoff"
  | "audio"
  | "tracks"
  | "speech"
>;
