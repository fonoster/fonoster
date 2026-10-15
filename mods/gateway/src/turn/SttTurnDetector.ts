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
import { Transcript } from "../speech/types";
import {
  BaselineDetector,
  BaselineOptions,
  Detector,
  Estimate
} from "./Detector";

/**
 * Silence after the last transcript before the turn ends anyway when a turn-aware recognizer
 * sends no turn signal (a safety net, not the normal path).
 */
export const STT_FALLBACK_TIMEOUT_MS = 2500;

/**
 * A turn-aware STT as the Detector (turn-taking, "A turn-aware STT as the Detector", task 2.6):
 * the recognizer's turn signals (`Transcript.turn`) drive the estimate. Voice activity still
 * comes from the baseline's energy VAD, so `speaking` and `kind` mean the same as with the
 * baseline and the Pacing policy, labels and events are unchanged.
 *
 * - While the caller speaks, eot is 0.
 * - A transcript with `turn.endOfTurn` sets eot to 1 (the recognizer decided).
 * - A transcript with only `turn.eot` reports that estimate (the policy may prepare on it).
 * - With no signal, eot rises over STT_FALLBACK_TIMEOUT_MS × patience after a final transcript,
 *   so a recognizer that goes quiet cannot hold a turn open forever.
 */
export class SttTurnDetector implements Detector {
  private readonly vad: BaselineDetector;
  private signal = 0;
  private hasSignal = false;
  private wasSpeaking = false;

  constructor(options: Partial<BaselineOptions> = {}) {
    this.vad = new BaselineDetector({
      ...options,
      silenceTimeoutMs: STT_FALLBACK_TIMEOUT_MS
    });
  }

  onAudio(frame: Buffer, at: number): Estimate {
    const e = this.vad.onAudio(frame, at);
    // New speech makes an earlier signal stale (the caller kept going).
    if (e.speaking && !this.wasSpeaking) {
      this.signal = 0;
      this.hasSignal = false;
    }
    this.wasSpeaking = e.speaking;
    if (e.speaking) return { ...e, eot: 0 };
    if (this.hasSignal) return { ...e, eot: this.signal };
    return e;
  }

  onTranscript(t: Transcript, at: number) {
    this.vad.onTranscript(t, at);
    if (!t.turn) return;
    if (t.turn.endOfTurn) this.signal = 1;
    else if (typeof t.turn.eot === "number")
      this.signal = Math.max(0, Math.min(1, t.turn.eot));
    else return;
    this.hasSignal = true;
  }

  onOutput(playing: boolean) {
    this.vad.onOutput(playing);
  }

  reset() {
    this.vad.reset();
    this.signal = 0;
    this.hasSignal = false;
  }

  /** Recognizers keep their own thresholds; patience stretches only the safety net. */
  setPatience(factor: number) {
    this.vad.setPatience(factor);
  }
}
