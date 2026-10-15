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
// decision is recorded with its outcome"). Live, only cut-off, slow and ok can be told apart;
// missed barge-ins and backchannel misfires need the truth and are measured by replay.

/** Provisional defaults (add-turn-taking open question 2). */
export const CUT_OFF_WINDOW_MS = 1500;
export const SLOW_THRESHOLD_MS = 2000;

export type TurnLabel = {
  label: "cut-off" | "slow" | "ok";
  gapMs: number;
  turnEndedAt: number;
  outputStartedAt: number;
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

  constructor(private readonly onLabel: (label: TurnLabel) => void) {}

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

  private label(label: TurnLabel["label"]) {
    const p = this.pending;
    if (!p || p.outputStartedAt === undefined) return;
    clearTimeout(this.timer);
    this.pending = undefined;
    this.onLabel({
      label,
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
