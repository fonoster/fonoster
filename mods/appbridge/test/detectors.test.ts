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
import { expect } from "chai";
import {
  BaselineDetector,
  createDetector,
  Detector,
  FRAME_BYTES,
  MAX_ADAPTATION,
  Pacing,
  RemoteDetector,
  serveDetector,
  SttTurnDetector,
  TurnEvent
} from "../src";

const voice = Buffer.alloc(FRAME_BYTES);
for (let i = 0; i < FRAME_BYTES / 2; i++)
  voice.writeInt16LE(Math.round(6000 * Math.sin(i / 3)), i * 2);
const silence = Buffer.alloc(FRAME_BYTES);
const tick = () => new Promise((r) => setImmediate(r));

function setup(
  detector: Detector,
  options: { patience?: "low" | "normal" | "high"; adapt?: boolean } = {}
) {
  const events: (TurnEvent & { at: number })[] = [];
  const changes: { factor: number; reason: string }[] = [];
  let t = 0;
  const pacing = new Pacing(
    detector,
    {
      turn: (e) => events.push({ ...e, at: t }),
      partial: () => undefined,
      estimate: () => undefined,
      interruption: () => undefined,
      patience: (c) => changes.push(c)
    },
    { language: "en-US", ...options }
  );
  const feed = (frame: Buffer, n: number) => {
    for (let i = 0; i < n; i++) pacing.onAudio(frame, (t += 20));
  };
  const say = (text: string, turn?: { eot?: number; endOfTurn?: boolean }) =>
    pacing.onTranscript(
      { text, final: true, language: "en-US", confidence: 0.9, turn },
      t
    );
  return { pacing, events, changes, feed, say, now: () => t };
}

const endedAt = (s: ReturnType<typeof setup>) =>
  s.events.find((e) => e.type === "turn.ended")?.at ?? Infinity;

describe("@appbridge/turn-taking patience", function () {
  function oneTurn(patience: "low" | "normal" | "high") {
    const s = setup(new BaselineDetector({ silenceTimeoutMs: 600 }), {
      patience
    });
    s.feed(voice, 20);
    s.say("I want to pay my bill");
    s.feed(silence, 100);
    return endedAt(s);
  }

  it("a more patient app receives turn.ended no earlier", function () {
    const low = oneTurn("low");
    const normal = oneTurn("normal");
    const high = oneTurn("high");
    expect(low).to.be.lessThan(normal);
    expect(normal).to.be.lessThan(high);
  });

  it("listen.update patience changes the running call", function () {
    const s = setup(new BaselineDetector({ silenceTimeoutMs: 600 }));
    s.pacing.setPatience("high");
    expect(s.pacing.patienceFactor).to.equal(1.6);
    expect(s.changes).to.deep.equal([
      { patience: "high", factor: 1.6, reason: "app" }
    ]);
  });

  it("adapts within the call after false alarms, up to a cap", function () {
    const s = setup(new BaselineDetector({ silenceTimeoutMs: 400 }));
    for (let i = 0; i < 8; i++) {
      s.feed(voice, 10);
      s.say("and");
      s.feed(silence, 22); // past prepare (0.5), short of commit
    }
    const resumes = s.events.filter((e) => e.type === "turn.resumed").length;
    expect(resumes).to.be.greaterThan(3);
    expect(s.changes.every((c) => c.reason === "adapted")).to.equal(true);
    expect(s.pacing.patienceFactor).to.be.at.most(MAX_ADAPTATION);
    expect(s.pacing.patienceFactor).to.be.greaterThan(1);
  });

  it("does not adapt when adaptation is off", function () {
    const s = setup(new BaselineDetector({ silenceTimeoutMs: 400 }), {
      adapt: false
    });
    s.feed(voice, 10);
    s.say("and");
    s.feed(silence, 22);
    s.feed(voice, 10);
    expect(s.pacing.patienceFactor).to.equal(1);
  });

  it("starts every call from the app's patience (no memory across calls)", function () {
    const first = setup(new BaselineDetector({ silenceTimeoutMs: 400 }));
    for (let i = 0; i < 4; i++) {
      first.feed(voice, 10);
      first.say("and");
      first.feed(silence, 22);
    }
    expect(first.pacing.patienceFactor).to.be.greaterThan(1);
    const second = setup(new BaselineDetector({ silenceTimeoutMs: 400 }));
    expect(second.pacing.patienceFactor).to.equal(1);
  });
});

describe("@appbridge/turn-taking turn-aware STT Detector", function () {
  it("ends the turn when the recognizer says so, not on a silence timer", function () {
    const s = setup(new SttTurnDetector());
    s.feed(voice, 20);
    s.say("I want to pay my bill", { eot: 0.6 });
    s.feed(silence, 15);
    expect(s.events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.likely_ended"
    ]);
    s.say("", { endOfTurn: true });
    s.feed(silence, 1);
    expect(s.events.map((e) => e.type)).to.deep.equal([
      "turn.user_started",
      "turn.likely_ended",
      "turn.ended"
    ]);
    expect(s.events[2]).to.include({ text: "I want to pay my bill" });
  });

  it("falls back to a long silence timer when the recognizer sends no signal", function () {
    const s = setup(new SttTurnDetector());
    s.feed(voice, 20);
    s.say("hello");
    s.feed(silence, 100);
    expect(endedAt(s)).to.equal(Infinity);
    s.feed(silence, 60);
    expect(endedAt(s)).to.be.lessThan(Infinity);
  });

  it("is selected by name and reports its version", function () {
    const { detector, version } = createDetector({
      silenceTimeoutMs: 600,
      detector: "stt"
    });
    expect(detector).to.be.instanceOf(SttTurnDetector);
    expect(version).to.equal("stt@1");
    expect(createDetector({ silenceTimeoutMs: 600 }).version).to.equal(
      "baseline@1"
    );
  });
});

describe("@appbridge/turn-taking out-of-process Detector (WebSocket)", function () {
  it("drives the same turn events as the in-process baseline", async function () {
    const server = await serveDetector({
      makeDetector: () => new BaselineDetector({ silenceTimeoutMs: 300 })
    });
    const sources: string[] = [];
    const remote = new RemoteDetector({
      url: `ws://127.0.0.1:${server.port}`,
      fallback: new BaselineDetector({ silenceTimeoutMs: 5000 }),
      onSource: (s) => sources.push(s)
    });
    try {
      const s = setup(remote);
      // Connect: silence until the remote answers.
      for (let i = 0; i < 200 && !sources.includes("remote"); i++) {
        s.feed(silence, 1);
        await new Promise((r) => setTimeout(r, 5));
      }
      expect(sources).to.include("remote");
      for (let i = 0; i < 20; i++) {
        s.feed(voice, 1);
        await tick();
        await new Promise((r) => setTimeout(r, 1));
      }
      s.say("I want to pay my bill");
      for (let i = 0; i < 40; i++) {
        s.feed(silence, 1);
        await new Promise((r) => setTimeout(r, 1));
      }
      // The fallback (5 s timeout) could not have ended the turn: the remote one did.
      expect(s.events.map((e) => e.type)).to.deep.equal([
        "turn.user_started",
        "turn.likely_ended",
        "turn.ended"
      ]);
    } finally {
      remote.close();
      await server.close();
    }
  });

  it("falls back to the local Detector when the remote one is unreachable", async function () {
    const sources: string[] = [];
    const remote = new RemoteDetector({
      url: "ws://127.0.0.1:1",
      fallback: new BaselineDetector({ silenceTimeoutMs: 200 }),
      onSource: (s, reason) => sources.push(`${s}:${reason}`)
    });
    try {
      const s = setup(remote);
      s.feed(voice, 20);
      s.say("hello");
      s.feed(silence, 30);
      expect(s.events.map((e) => e.type)).to.include("turn.ended");
      expect(sources[0]).to.equal("fallback:unavailable");
    } finally {
      remote.close();
    }
  });
});
