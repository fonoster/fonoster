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
import { FRAME_MS, rms } from "../audio/pcm";
import { Transcript } from "../speech/types";

// turn-taking, "Detectors are pluggable behind one interface": caller audio, transcript segments
// and agent output state in; a continuous end-of-thought estimate and facts out. A Detector never
// emits turn events; the Pacing policy does.

export type SpeechKind = "speech" | "backchannel" | "interruption" | "none";

export type Estimate = {
  /** End-of-thought estimate, 0 to 1. */
  eot: number;
  speaking: boolean;
  kind: SpeechKind;
};

export interface Detector {
  /** One 20 ms internal frame of (filtered) caller audio. Drives the Detector's clock. */
  onAudio(frame: Buffer, at: number): Estimate;
  onTranscript(transcript: Transcript, at: number): void;
  /** Whether agent output is audible right now. */
  onOutput(playing: boolean): void;
  /** Forget the current turn (called by the Pacing policy after turn.ended). */
  reset(): void;
}

export type BaselineOptions = {
  /** Silence after a final transcript before eot reaches 1 (today's endpointing timer). */
  silenceTimeoutMs: number;
  /** RMS above which a frame counts as voice. */
  voiceThreshold?: number;
  /** Consecutive voiced frames to start speaking, unvoiced frames to stop (debounce). */
  activationFrames?: number;
  deactivationFrames?: number;
};

/**
 * The baseline Detector (turn-taking TT, "reproduces today's behavior"): energy VAD with
 * debounce, final transcripts, and a silence timer. eot stays 0 while the caller speaks and rises
 * linearly to 1 over the silence timeout once a final transcript has arrived.
 */
export class BaselineDetector implements Detector {
  private speaking = false;
  private voiced = 0;
  private unvoiced = 0;
  private silenceMs = 0;
  private hasFinal = false;
  private playing = false;

  constructor(private readonly options: BaselineOptions) {}

  /** Patience (turn-taking): a longer timeout waits longer before the turn ends. */
  setSilenceTimeout(ms: number) {
    this.options.silenceTimeoutMs = ms;
  }

  onAudio(frame: Buffer, _at: number): Estimate {
    const voice = rms(frame) > (this.options.voiceThreshold ?? 700);
    if (voice) {
      this.voiced++;
      this.unvoiced = 0;
      if (!this.speaking && this.voiced >= (this.options.activationFrames ?? 4))
        this.speaking = true;
    } else {
      this.unvoiced++;
      this.voiced = 0;
      if (
        this.speaking &&
        this.unvoiced >= (this.options.deactivationFrames ?? 10)
      )
        this.speaking = false;
    }

    if (this.speaking) this.silenceMs = 0;
    else this.silenceMs += FRAME_MS;

    const eot =
      this.speaking || !this.hasFinal
        ? 0
        : Math.min(1, this.silenceMs / this.options.silenceTimeoutMs);
    // The baseline does not classify backchannels: any speech over agent output is an interruption.
    const kind: SpeechKind = this.speaking
      ? this.playing
        ? "interruption"
        : "speech"
      : "none";
    return { eot, speaking: this.speaking, kind };
  }

  onTranscript(transcript: Transcript, _at: number) {
    if (transcript.final && transcript.text.trim()) {
      this.hasFinal = true;
      // A final transcript closes the utterance the recognizer heard: count silence from here.
      this.silenceMs = 0;
    }
  }

  onOutput(playing: boolean) {
    this.playing = playing;
  }

  reset() {
    this.hasFinal = false;
    this.silenceMs = 0;
  }
}
