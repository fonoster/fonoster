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
import { Detector, Estimate } from "./Detector";

/**
 * A fake Detector that replays a scripted estimate timeline, to test Pacing policies in isolation
 * (add-turn-taking task 1.3). Each point holds until the next one.
 */
export class ScriptedDetector implements Detector {
  private start?: number;
  readonly outputs: boolean[] = [];

  constructor(private readonly timeline: ({ atMs: number } & Estimate)[]) {}

  onAudio(_frame: Buffer, at: number): Estimate {
    this.start ??= at;
    const t = at - this.start;
    const point = [...this.timeline].reverse().find((p) => p.atMs <= t);
    return point
      ? { eot: point.eot, speaking: point.speaking, kind: point.kind }
      : { eot: 0, speaking: false, kind: "none" };
  }

  onTranscript(_t: Transcript, _at: number) {}

  onOutput(playing: boolean) {
    this.outputs.push(playing);
  }

  reset() {}
}

/**
 * Records every estimate a Detector produces, to test Detectors in isolation from any Pacing
 * policy (add-turn-taking task 1.4).
 */
export class RecordingDetector implements Detector {
  readonly estimates: ({ at: number } & Estimate)[] = [];

  constructor(private readonly inner: Detector) {}

  onAudio(frame: Buffer, at: number): Estimate {
    const e = this.inner.onAudio(frame, at);
    this.estimates.push({ at, ...e });
    return e;
  }

  onTranscript(t: Transcript, at: number) {
    this.inner.onTranscript(t, at);
  }

  onOutput(playing: boolean) {
    this.inner.onOutput(playing);
  }

  reset() {
    this.inner.reset();
  }
}
