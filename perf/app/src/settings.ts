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
// Settings from the environment (perf/compose.yaml).

function int(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer`);
  return value;
}

export const settings = {
  appPort: int("APP_PORT", 7080),
  ttsPort: int("TTS_PORT", 7001),
  sttPort: int("STT_PORT", 7002),
  /** A final transcript every this many ms of caller audio. */
  sttFinalEveryMs: int("STT_FINAL_EVERY_MS", 4000),
  /** Two caller-audio frames further apart than this: hang up. */
  callerAudioGapMaxMs: int("CALLER_AUDIO_GAP_MAX_MS", 200),
  /** output.started later than this after a speak on an empty queue: hang up. */
  speakStartMaxMs: int("SPEAK_START_MAX_MS", 200),
  /** No turn.ended this long after output.done: hang up. */
  turnTimeoutMs: int("TURN_TIMEOUT_MS", 10000)
};
