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

const BACKCHANNELS = new Set([
  "uh-huh",
  "uh huh",
  "mhm",
  "mm-hmm",
  "mm hmm",
  "yeah",
  "yes",
  "ok",
  "okay",
  "right",
  "sure",
  "i see",
  "ajá",
  "aja",
  "sí",
  "si",
  "claro",
  "ok",
  "vale",
  "ya",
  "mmm"
]);

/**
 * A candidate Detector (not the default): like the baseline, but caller speech over agent output
 * counts as an interruption only after `holdMs` of speech, unless it is a known backchannel.
 * It trades a slower barge-in for fewer backchannel misfires; the replay decides.
 */
export class BackchannelDetector implements Detector {
  private base: BaselineDetector;
  private speakingSince?: number;
  private lastText = "";
  private playing = false;

  constructor(
    options: BaselineOptions,
    private readonly holdMs = 500
  ) {
    this.base = new BaselineDetector(options);
  }

  onAudio(frame: Buffer, at: number): Estimate {
    const e = this.base.onAudio(frame, at);
    if (!e.speaking) {
      this.speakingSince = undefined;
      return e;
    }
    this.speakingSince ??= at;
    if (!this.playing) return e;
    const long = at - this.speakingSince >= this.holdMs;
    const backchannel = BACKCHANNELS.has(
      this.lastText
        .toLowerCase()
        .replace(/[.,!?]/g, "")
        .trim()
    );
    // Hold: report "speech" (not an interruption) until the hold passes; a recognized
    // backchannel never interrupts.
    return {
      ...e,
      kind: long && !backchannel ? "interruption" : "backchannel"
    };
  }

  onTranscript(t: Transcript, at: number) {
    this.lastText = t.text;
    this.base.onTranscript(t, at);
  }

  onOutput(playing: boolean) {
    this.playing = playing;
    this.base.onOutput(playing);
  }

  reset() {
    this.base.reset();
  }
}
