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
/** A turn with no speech and no transcript for this long is abandoned (turn-taking). */
export const ABANDON_AFTER_MS = 10000;

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
      abandoned?: true;
    }
  | { type: "turn.backchannel"; text: string };

/** The one patience knob (turn-taking): factors applied to the Detector's timing. */
export const PATIENCE = { low: 0.6, normal: 1, high: 1.6 } as const;
export type Patience = keyof typeof PATIENCE;

/**
 * Within-call adaptation (add-turn-taking OQ6, TT-B6): every false alarm (`turn.resumed`) makes
 * the policy this much more patient, up to MAX_ADAPTATION times the app's patience. It never
 * becomes less patient than the app asked for, and a new call starts from the app's setting.
 */
export const ADAPTATION_STEP = 0.15;
export const MAX_ADAPTATION = 1.6;

export type PacingOptions = {
  prepareThreshold?: number;
  commitThreshold?: number;
  /** Language reported when the recognizer gives none. */
  language: string;
  /** The app's patience (default normal). */
  patience?: Patience;
  /** Adapt patience to the caller's pauses within the call (default true). */
  adapt?: boolean;
};

export type PacingHandlers = {
  turn(event: TurnEvent): void;
  partial(text: string, language: string): void;
  estimate(estimate: Estimate): void;
  /** Caller speech of kind interruption while agent output plays. */
  interruption(): void;
  /** Patience changed (app setting or within-call adaptation); for the call record. */
  patience?(change: {
    patience: Patience;
    factor: number;
    reason: "app" | "adapted";
  }): void;
};

/**
 * AppBridge's default Pacing policy (turn-taking TT3/TT4): reads the Detector's estimate and
 * emits turn events in the order user_started, (likely_ended, resumed)*, likely_ended?, ended.
 */
export class Pacing {
  private inTurn = false;
  private likelyEnded = false;
  private wasSpeaking = false;
  private burstKind: Estimate["kind"] = "none";
  private backchannelUntil?: number;
  private turnStart = 0;
  private lastSpeechAt = 0;
  private finals: Transcript[] = [];
  private partialText = "";
  private language: string;
  private readonly prepare: number;
  private readonly commit: number;
  private patienceLevel: Patience;
  private adaptation = 1;
  private readonly adapt: boolean;

  constructor(
    private readonly detector: Detector,
    private readonly handlers: PacingHandlers,
    options: PacingOptions
  ) {
    this.language = options.language;
    this.prepare = options.prepareThreshold ?? 0.5;
    this.commit = options.commitThreshold ?? 1;
    this.patienceLevel = options.patience ?? "normal";
    this.adapt = options.adapt ?? true;
    if (this.patienceLevel !== "normal") this.applyPatience();
  }

  /** The factor applied to the Detector's timing right now. */
  get patienceFactor() {
    return +(PATIENCE[this.patienceLevel] * this.adaptation).toFixed(3);
  }

  /** `listen.update {patience}`: the app's knob; within-call adaptation is kept on top of it. */
  setPatience(patience: Patience) {
    if (!(patience in PATIENCE)) return;
    this.patienceLevel = patience;
    this.applyPatience();
    this.handlers.patience?.({
      patience,
      factor: this.patienceFactor,
      reason: "app"
    });
  }

  private applyPatience() {
    this.detector.setPatience?.(this.patienceFactor);
  }

  /** A false alarm: the caller paused mid-thought. Become a little more patient for this call. */
  private adaptToPause() {
    if (!this.adapt || this.adaptation >= MAX_ADAPTATION) return;
    this.adaptation = Math.min(
      MAX_ADAPTATION,
      +(this.adaptation + ADAPTATION_STEP).toFixed(3)
    );
    this.applyPatience();
    this.handlers.patience?.({
      patience: this.patienceLevel,
      factor: this.patienceFactor,
      reason: "adapted"
    });
  }

  private resumed() {
    this.likelyEnded = false;
    this.handlers.turn({ type: "turn.resumed" });
    this.adaptToPause();
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
    if (estimate.speaking) this.lastSpeechAt = at;

    if (!this.inTurn) return;
    if (
      !estimate.speaking &&
      !this.finals.length &&
      !this.partialText &&
      at - this.lastSpeechAt >= ABANDON_AFTER_MS
    )
      return this.endTurn(at, true);
    if (this.likelyEnded && estimate.eot < this.prepare && !estimate.speaking)
      this.resumed();
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
    else if (this.likelyEnded) this.resumed();
  }

  private startTurn(at: number) {
    this.inTurn = true;
    this.likelyEnded = false;
    this.turnStart = at;
    this.lastSpeechAt = at;
    this.handlers.turn({ type: "turn.user_started" });
  }

  private endTurn(at: number, abandoned = false) {
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
      durationMs: at - this.turnStart,
      ...(abandoned ? { abandoned: true as const } : {})
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
