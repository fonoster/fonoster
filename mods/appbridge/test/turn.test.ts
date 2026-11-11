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
import { BaselineDetector, FRAME_BYTES, Pacing, TurnEvent } from "../src";

const voice = Buffer.alloc(FRAME_BYTES);
for (let i = 0; i < FRAME_BYTES / 2; i++)
  voice.writeInt16LE(Math.round(6000 * Math.sin(i / 3)), i * 2);
const silence = Buffer.alloc(FRAME_BYTES);

function setup(silenceTimeoutMs = 200) {
  const events: TurnEvent[] = [];
  let interruptions = 0;
  let t = 0;
  const pacing = new Pacing(
    new BaselineDetector({ silenceTimeoutMs }),
    {
      turn: (e) => events.push(e),
      partial: () => undefined,
      estimate: () => undefined,
      interruption: () => interruptions++
    },
    { language: "en-US" }
  );
  const feed = (frame: Buffer, n: number) => {
    for (let i = 0; i < n; i++) pacing.onAudio(frame, (t += 20));
  };
  const final = (text: string) =>
    pacing.onTranscript(
      { text, final: true, language: "en-US", confidence: 0.9 },
      t
    );
  return { pacing, events, feed, final, interruptions: () => interruptions };
}

describe("@appbridge/turn-taking (baseline + pacing)", function () {
  it("emits user_started, likely_ended and ended in order", function () {
    const s = setup();
    s.feed(voice, 20);
    s.final("I want to pay my bill");
    s.feed(silence, 30);
    expect(s.events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.likely_ended",
      "turn.ended"
    ]);
    expect(s.events[2]).to.include({
      text: "I want to pay my bill",
      language: "en-US",
      confidence: 0.9
    });
  });

  it("sends resumed when the caller continues after likely_ended", function () {
    const s = setup(400);
    s.feed(voice, 10);
    s.final("I want to");
    s.feed(silence, 22);
    s.feed(voice, 10);
    s.final("pay my bill");
    s.feed(silence, 40);
    expect(s.events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.likely_ended",
      "turn.resumed",
      "turn.likely_ended",
      "turn.ended"
    ]);
    expect(s.events[4]).to.include({ text: "I want to pay my bill" });
  });

  it("does not end a turn without a final transcript", function () {
    const s = setup();
    s.feed(voice, 10);
    s.feed(silence, 50);
    expect(s.events.map((e) => e.type)).to.deep.equal(["turn.user_started"]);
  });

  it("reports an interruption when the caller speaks over output", function () {
    const s = setup();
    s.pacing.onOutput(true);
    s.feed(voice, 10);
    expect(s.interruptions()).to.equal(1);
    expect(s.events[0].type).to.equal("turn.user_started");
  });

  it("waits longer for a more patient app", function () {
    const quick = setup(200);
    const patient = setup(800);
    for (const s of [quick, patient]) {
      s.feed(voice, 10);
      s.final("hello");
    }
    quick.feed(silence, 25);
    patient.feed(silence, 25);
    expect(quick.events.some((e) => e.type === "turn.ended")).to.equal(true);
    expect(patient.events.some((e) => e.type === "turn.ended")).to.equal(false);
  });
});

// #1266: a recognizer like Deepgram holds its final until well after the caller stops, so Pacing
// asks for it once per silence while a partial is pending.
describe("@appbridge/turn-taking (asking for the final)", function () {
  function setupAsking(handlers: { finalize?: () => void } = {}) {
    const events: TurnEvent[] = [];
    let t = 0;
    const pacing = new Pacing(
      new BaselineDetector({ silenceTimeoutMs: 200 }),
      {
        turn: (e) => events.push(e),
        partial: () => undefined,
        estimate: () => undefined,
        interruption: () => undefined,
        ...handlers
      },
      { language: "en-US" }
    );
    const feed = (frame: Buffer, n: number) => {
      for (let i = 0; i < n; i++) pacing.onAudio(frame, (t += 20));
    };
    const transcript = (text: string, final: boolean) =>
      pacing.onTranscript(
        { text, final, language: "en-US", confidence: 0.9 },
        t
      );
    return { events, feed, transcript };
  }

  it("asks once per silence while a partial is pending", function () {
    let asked = 0;
    const s = setupAsking({ finalize: () => asked++ });
    s.feed(voice, 10);
    s.transcript("one, two", false);
    s.feed(silence, 20);
    expect(asked).to.equal(1);
    s.feed(voice, 10);
    s.transcript("one, two three", false);
    s.feed(silence, 20);
    expect(asked).to.equal(2);
  });

  it("asks when the partial arrives after the caller went silent", function () {
    let asked = 0;
    const s = setupAsking({ finalize: () => asked++ });
    s.feed(voice, 10);
    s.feed(silence, 15);
    expect(asked).to.equal(0);
    s.transcript("one, two", false);
    s.feed(silence, 1);
    expect(asked).to.equal(1);
  });

  it("never asks when the last transcript was a final", function () {
    let asked = 0;
    const s = setupAsking({ finalize: () => asked++ });
    s.feed(voice, 10);
    s.transcript("one, two", false);
    s.transcript("one, two", true);
    s.feed(silence, 30);
    expect(asked).to.equal(0);
    expect(s.events.map((e) => e.type)).to.include("turn.ended");
  });

  it("ends turns as before with a recognizer that cannot be asked", function () {
    // Call wires the handler as `() => stt.finalize?.()`; an adapter without finalize is a no-op.
    const stream: { finalize?: () => void } = {};
    for (const handlers of [{}, { finalize: () => stream.finalize?.() }]) {
      const s = setupAsking(handlers);
      s.feed(voice, 10);
      s.transcript("one, two", false);
      s.feed(silence, 30);
      expect(s.events.map((e) => e.type)).to.deep.equal(["turn.user_started"]);
      s.transcript("one, two", true);
      s.feed(silence, 30);
      expect(s.events.map((e) => e.type)).to.deep.equal([
        "turn.user_started",
        "turn.likely_ended",
        "turn.ended"
      ]);
    }
  });
});
