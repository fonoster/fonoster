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

/** How long after a backchannel burst its transcript may arrive and still count as one. */
const BACKCHANNEL_TRANSCRIPT_WINDOW_MS = 1500;

export type TurnEvent =
  | { type: "turn.user_started" }
  | { type: "turn.likely_ended"; text: string }
  | { type: "turn.resumed" }
  | {
      type: "turn.ended";
      text: string;
      language: string;
      confidence: number;
      durationMs: number;
    }
  | { type: "turn.backchannel"; text: string };

export type PacingOptions = {
  prepareThreshold?: number;
  commitThreshold?: number;
  /** Language reported when the recognizer gives none. */
  language: string;
};

export type PacingHandlers = {
  turn(event: TurnEvent): void;
  partial(text: string, language: string): void;
  estimate(estimate: Estimate): void;
  /** Caller speech of kind interruption while agent output plays. */
  interruption(): void;
};

/**
 * The gateway's default Pacing policy (turn-taking TT3/TT4): reads the Detector's estimate and
 * emits turn events in the order user_started, (likely_ended, resumed)*, likely_ended?, ended.
 */
export class Pacing {
  private inTurn = false;
  private likelyEnded = false;
  private wasSpeaking = false;
  private burstKind: Estimate["kind"] = "none";
  private backchannelUntil?: number;
  private turnStart = 0;
  private finals: Transcript[] = [];
  private partialText = "";
  private language: string;
  private readonly prepare: number;
  private readonly commit: number;

  constructor(
    private readonly detector: Detector,
    private readonly handlers: PacingHandlers,
    options: PacingOptions
  ) {
    this.language = options.language;
    this.prepare = options.prepareThreshold ?? 0.5;
    this.commit = options.commitThreshold ?? 1;
  }

  setLanguage(language: string) {
    this.language = language;
  }

  onOutput(playing: boolean) {
    this.detector.onOutput(playing);
  }

  onTranscript(t: Transcript, at: number) {
    this.detector.onTranscript(t, at);
    if (!t.text.trim()) return;
    if (
      t.final &&
      this.backchannelUntil !== undefined &&
      at <= this.backchannelUntil &&
      !this.inTurn
    ) {
      // The transcript of a burst the Detector called a backchannel: not a turn.
      this.backchannelUntil = undefined;
      this.detector.reset();
      this.handlers.turn({ type: "turn.backchannel", text: t.text });
      return;
    }
    if (!this.inTurn) this.startTurn(at);
    if (t.final) {
      this.finals.push(t);
      this.partialText = "";
    } else {
      this.partialText = t.text;
      this.handlers.partial(this.text(), t.language || this.language);
    }
  }

  onAudio(frame: Buffer, at: number) {
    const estimate = this.detector.onAudio(frame, at);
    this.handlers.estimate(estimate);

    if (estimate.speaking && !this.wasSpeaking) {
      this.burstKind = estimate.kind;
      // A burst the Detector calls a backchannel is held back: no turn, no interruption, unless
      // the Detector later reclassifies it.
      if (estimate.kind !== "backchannel") this.callerTakesTurn(estimate, at);
    } else if (
      estimate.speaking &&
      this.burstKind === "backchannel" &&
      estimate.kind !== "backchannel"
    ) {
      this.burstKind = estimate.kind;
      this.callerTakesTurn(estimate, at);
    } else if (
      !estimate.speaking &&
      this.wasSpeaking &&
      this.burstKind === "backchannel"
    ) {
      this.backchannelUntil = at + BACKCHANNEL_TRANSCRIPT_WINDOW_MS;
    }
    this.wasSpeaking = estimate.speaking;

    if (!this.inTurn) return;
    if (this.likelyEnded && estimate.eot < this.prepare && !estimate.speaking) {
      this.likelyEnded = false;
      this.handlers.turn({ type: "turn.resumed" });
    }
    if (
      !this.likelyEnded &&
      estimate.eot >= this.prepare &&
      estimate.eot < this.commit
    ) {
      this.likelyEnded = true;
      this.handlers.turn({ type: "turn.likely_ended", text: this.text() });
    }
    if (estimate.eot >= this.commit) this.endTurn(at);
  }

  private callerTakesTurn(estimate: Estimate, at: number) {
    this.backchannelUntil = undefined;
    if (estimate.kind === "interruption") this.handlers.interruption();
    if (!this.inTurn) this.startTurn(at);
    else if (this.likelyEnded) {
      this.likelyEnded = false;
      this.handlers.turn({ type: "turn.resumed" });
    }
  }

  private startTurn(at: number) {
    this.inTurn = true;
    this.likelyEnded = false;
    this.turnStart = at;
    this.handlers.turn({ type: "turn.user_started" });
  }

  private endTurn(at: number) {
    const text = this.text();
    const language =
      this.finals[this.finals.length - 1]?.language || this.language;
    const confidence = this.finals.length
      ? this.finals.reduce((s, t) => s + t.confidence, 0) / this.finals.length
      : 0;
    this.handlers.turn({
      type: "turn.ended",
      text,
      language,
      confidence,
      durationMs: at - this.turnStart
    });
    this.inTurn = false;
    this.likelyEnded = false;
    this.finals = [];
    this.partialText = "";
    this.detector.reset();
  }

  private text(): string {
    return [...this.finals.map((f) => f.text), this.partialText]
      .filter(Boolean)
      .join(" ")
      .trim();
  }
}
