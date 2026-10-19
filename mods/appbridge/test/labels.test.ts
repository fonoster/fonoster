/*
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
import { expect } from "chai";
import { createSandbox } from "sinon";
import { FRAME_BYTES, Pacing, TurnEvent } from "../src";
import {
  BARGE_IN_WINDOW_MS,
  CUT_OFF_WINDOW_MS,
  TurnLabel,
  TurnLabeler
} from "../src/turn/TurnLabeler";
import { RecordingDetector, ScriptedDetector } from "../src/turn/testing";
import { BaselineDetector } from "../src/turn/Detector";

const quiet = { eot: 0, speaking: false, kind: "none" as const };
const talking = { eot: 0, speaking: true, kind: "speech" as const };

describe("@AppBridge turn labels", function () {
  const sandbox = createSandbox();
  let clock: ReturnType<typeof sandbox.useFakeTimers>;
  let labels: TurnLabel[];
  let labeler: TurnLabeler;

  beforeEach(() => {
    clock = sandbox.useFakeTimers();
    labels = [];
    labeler = new TurnLabeler((l) => labels.push(l));
  });
  afterEach(() => sandbox.restore());

  function turn(speechEnd: number, ended: number, output: number) {
    labeler.estimate(talking, 0);
    labeler.estimate(quiet, speechEnd);
    labeler.turnEnded(ended);
    labeler.outputStarted(output);
  }

  it("labels a clean turn ok after the cut-off window", function () {
    turn(1000, 1900, 2500);
    clock.tick(CUT_OFF_WINDOW_MS + 1);
    expect(labels).to.deep.equal([
      {
        label: "ok",
        labelVersion: 2,
        gapMs: 1500,
        turnEndedAt: 1900,
        outputStartedAt: 2500
      }
    ]);
  });

  it("labels a reply that starts too late as slow", function () {
    turn(1000, 1900, 3600);
    clock.tick(CUT_OFF_WINDOW_MS + 1);
    expect(labels[0]).to.include({ label: "slow", gapMs: 2600 });
  });

  it("labels a cut-off when the caller resumes right after the reply starts", function () {
    turn(1000, 1900, 2500);
    labeler.estimate(talking, 3000);
    expect(labels[0]).to.include({ label: "cut-off" });
  });
  it("labels a missed barge-in when the app lets output play on", function () {
    labeler.outputStarted(0);
    labeler.interruption(100);
    clock.tick(BARGE_IN_WINDOW_MS + 1);
    expect(labels).to.deep.equal([
      { label: "missed-barge-in", labelVersion: 2, at: 100 }
    ]);
  });

  it("does not label a barge-in the app cleared", function () {
    labeler.outputStarted(0);
    labeler.interruption(100);
    labeler.outputCleared(300);
    labeler.outputStopped(300);
    clock.tick(BARGE_IN_WINDOW_MS + 1);
    expect(labels).to.deep.equal([]);
  });

  it("labels a clear right after a backchannel as a misfire", function () {
    labeler.outputStarted(0);
    labeler.backchannel(500);
    labeler.outputCleared(700);
    expect(labels).to.deep.equal([
      { label: "backchannel-misfire", labelVersion: 2, at: 700 }
    ]);
  });
});

describe("@AppBridge turn-taking test doubles", function () {
  it("drives Pacing from a scripted estimate timeline", function () {
    const events: TurnEvent[] = [];
    const detector = new ScriptedDetector([
      { atMs: 0, ...talking },
      { atMs: 200, eot: 0.6, speaking: false, kind: "none" },
      { atMs: 400, eot: 1, speaking: false, kind: "none" }
    ]);
    const pacing = new Pacing(
      detector,
      {
        turn: (e) => events.push(e),
        partial: () => undefined,
        estimate: () => undefined,
        interruption: () => undefined
      },
      { language: "en" }
    );
    for (let t = 0; t <= 500; t += 20)
      pacing.onAudio(Buffer.alloc(FRAME_BYTES), t);
    expect(events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.likely_ended",
      "turn.ended"
    ]);
  });

  it("abandons a turn with no speech and no transcript for 10 s", function () {
    const events: TurnEvent[] = [];
    const detector = new ScriptedDetector([
      { atMs: 0, ...talking },
      { atMs: 300, eot: 0, speaking: false, kind: "none" }
    ]);
    const pacing = new Pacing(
      detector,
      {
        turn: (e) => events.push(e),
        partial: () => undefined,
        estimate: () => undefined,
        interruption: () => undefined
      },
      { language: "en" }
    );
    for (let t = 0; t <= 10400; t += 20)
      pacing.onAudio(Buffer.alloc(FRAME_BYTES), t);
    expect(events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.ended"
    ]);
    expect(events[1]).to.include({ text: "", abandoned: true });
  });

  it("waits longer with a longer silence timeout (patience)", function () {
    const detector = new BaselineDetector({ silenceTimeoutMs: 600 });
    detector.onTranscript(
      { text: "hi", final: true, language: "en", confidence: 1 },
      0
    );
    detector.setSilenceTimeout(1200);
    let eot = 0;
    for (let t = 20; t <= 600; t += 20)
      eot = detector.onAudio(Buffer.alloc(FRAME_BYTES), t).eot;
    expect(eot).to.be.closeTo(0.5, 0.05);
  });

  it("records a Detector's estimates without changing them", function () {
    const recording = new RecordingDetector(
      new BaselineDetector({ silenceTimeoutMs: 600 })
    );
    recording.onAudio(Buffer.alloc(FRAME_BYTES), 20);
    expect(recording.estimates).to.deep.equal([
      { at: 20, eot: 0, speaking: false, kind: "none" }
    ]);
  });
});
