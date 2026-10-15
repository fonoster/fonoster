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
import { EventEmitter } from "events";

export type WordTiming = { word: string; startMs: number; endMs: number };

/** Provider failures, named after the session error codes they become (VS17). */
export class SpeechError extends Error {
  constructor(
    readonly code:
      | "provider_unavailable"
      | "provider_timeout"
      | "bad_message"
      | "internal",
    message: string
  ) {
    super(message);
  }
}

export type Synthesis = {
  /** Internal-format audio (PCM16LE, 16 kHz) as it arrives. */
  audio: AsyncIterable<Buffer>;
  /** Word timings relative to the start of this audio, when the provider reports them. */
  words?: WordTiming[];
};

export interface TtsAdapter {
  synthesize(
    request: { text: string; voice: string; language: string },
    signal: AbortSignal
  ): Promise<Synthesis>;
}

export type Transcript = {
  text: string;
  final: boolean;
  language: string;
  confidence: number;
  startMs?: number;
  endMs?: number;
  /**
   * Turn signals from a turn-aware recognizer (catalog feature `turn-detection`): its own
   * end-of-thought estimate and whether it declared the end of the turn. Absent otherwise.
   */
  turn?: { eot?: number; endOfTurn?: boolean };
};

/** One streaming recognition session. Emits "transcript" (Transcript) and "error" (SpeechError). */
export interface SttStream extends EventEmitter {
  write(frame: Buffer): void;
  update(options: { language?: string; hints?: string[] }): void;
  close(): void;
}

export interface SttAdapter {
  open(options: { language: string; hints?: string[] }): SttStream;
}
