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
import { Estimate } from "./Detector";

// Labels each caller turn with its observed outcome for the call record (turn-taking, "Every turn
// decision is recorded with its outcome"). The app owns interruption (B22), so output stops are
// judged against the app's clear: an interruption the app let play on past the barge-in window is
// a missed barge-in; a clear right after a backchannel is a backchannel misfire.

/** Provisional defaults (add-turn-taking open question 2). */
export const CUT_OFF_WINDOW_MS = 1500;
export const SLOW_THRESHOLD_MS = 2000;
export const BARGE_IN_WINDOW_MS = 1000;
/** Bumped whenever the labeling rules change; replays compare only labels of one version. */
export const LABEL_VERSION = 2;

export type TurnLabel =
  | {
      label: "cut-off" | "slow" | "ok";
      labelVersion: number;
      gapMs: number;
      turnEndedAt: number;
      outputStartedAt: number;
    }
  | {
      label: "missed-barge-in" | "backchannel-misfire";
      labelVersion: number;
      at: number;
    };

export class TurnLabeler {
  private speaking = false;
  private lastSpeechEndAt = 0;
  private pending?: {
    turnEndedAt: number;
    speechEndAt: number;
    outputStartedAt?: number;
    slow?: boolean;
  };
  private timer?: ReturnType<typeof setTimeout>;
  private playing = false;
  private bargeTimer?: ReturnType<typeof setTimeout>;
  private lastBackchannelAt?: number;

  constructor(private readonly onLabel: (label: TurnLabel) => void) {}

  /** Caller speech the Detector called an interruption, while output played. */
  interruption(at: number) {
    if (!this.playing || this.bargeTimer) return;
    this.bargeTimer = setTimeout(() => {
      this.bargeTimer = undefined;
      if (this.playing)
        this.onLabel({
          label: "missed-barge-in",
          labelVersion: LABEL_VERSION,
          at
        });
    }, BARGE_IN_WINDOW_MS);
  }

  backchannel(at: number) {
    this.lastBackchannelAt = at;
  }

  /** The app stopped output (clear or preempt). */
  outputCleared(at: number) {
    clearTimeout(this.bargeTimer);
    this.bargeTimer = undefined;
    if (
      this.lastBackchannelAt !== undefined &&
      at - this.lastBackchannelAt <= BARGE_IN_WINDOW_MS
    ) {
      this.lastBackchannelAt = undefined;
      this.onLabel({
        label: "backchannel-misfire",
        labelVersion: LABEL_VERSION,
        at
      });
    }
  }

  outputStopped(_at: number) {
    this.playing = false;
  }

  estimate(e: Estimate, at: number) {
    if (this.speaking && !e.speaking) this.lastSpeechEndAt = at;
    if (!this.speaking && e.speaking) this.callerSpoke(at);
    this.speaking = e.speaking;
  }

  turnEnded(at: number) {
    this.flush();
    this.pending = { turnEndedAt: at, speechEndAt: this.lastSpeechEndAt || at };
  }

  outputStarted(at: number) {
    this.playing = true;
    const p = this.pending;
    if (!p || p.outputStartedAt !== undefined) return;
    p.outputStartedAt = at;
    p.slow = at - p.speechEndAt > SLOW_THRESHOLD_MS;
    this.timer = setTimeout(
      () => this.label(p.slow ? "slow" : "ok"),
      CUT_OFF_WINDOW_MS
    );
  }

  stop() {
    clearTimeout(this.bargeTimer);
    this.flush();
  }

  private callerSpoke(at: number) {
    const p = this.pending;
    if (
      p?.outputStartedAt !== undefined &&
      at - p.outputStartedAt <= CUT_OFF_WINDOW_MS
    )
      this.label("cut-off");
  }

  private label(label: "cut-off" | "slow" | "ok") {
    const p = this.pending;
    if (!p || p.outputStartedAt === undefined) return;
    clearTimeout(this.timer);
    this.pending = undefined;
    this.onLabel({
      label,
      labelVersion: LABEL_VERSION,
      gapMs: p.outputStartedAt - p.speechEndAt,
      turnEndedAt: p.turnEndedAt,
      outputStartedAt: p.outputStartedAt
    });
  }

  private flush() {
    if (this.pending?.outputStartedAt !== undefined)
      this.label(this.pending.slow ? "slow" : "ok");
    clearTimeout(this.timer);
    this.pending = undefined;
  }
}
