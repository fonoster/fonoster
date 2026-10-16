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
import * as fs from "fs";
import * as path from "path";
import { expect } from "chai";
import { BackchannelDetector } from "../src/turn/BackchannelDetector";
import { Corpus, CorpusCall } from "../src/turn/corpus";
import { BaselineDetector } from "../src/turn/Detector";
import {
  categoryOf,
  compare,
  formatReport,
  replay,
  replayCall
} from "../src/turn/replay";

const baseline = () => new BaselineDetector({ silenceTimeoutMs: 600 });
const corpus = JSON.parse(
  fs.readFileSync(
    path.join(
      __dirname,
      "..",
      "..",
      "conformance",
      "turn-corpus",
      "synthetic-v1.json"
    ),
    "utf8"
  )
) as Corpus;

const call = (c: Partial<CorpusCall>): CorpusCall => ({
  name: "t",
  consent: "synthetic",
  language: "en",
  segments: [],
  agent: [],
  ...c
});

describe("@gateway turn-taking replay", function () {
  it("measures the delay from the true end of a turn to turn.ended", function () {
    const r = replayCall(
      call({
        segments: [
          { startMs: 500, endMs: 2000, text: "hello", kind: "turn", turn: 1 }
        ]
      }),
      baseline
    );
    expect(r.falseCutOffs).to.equal(0);
    expect(r.delays).to.have.length(1);
    // Recognizer latency (300 ms) plus the silence timeout (600 ms), within a frame.
    expect(r.delays[0]).to.be.within(880, 920);
  });

  it("counts a long pause inside a turn as a false cut-off", function () {
    const r = replayCall(
      call({
        segments: [
          {
            startMs: 500,
            endMs: 1500,
            text: "I want to",
            kind: "turn",
            turn: 1
          },
          {
            startMs: 3000,
            endMs: 3800,
            text: "pay my bill",
            kind: "turn",
            turn: 1
          }
        ]
      }),
      baseline
    );
    expect(r.falseCutOffs).to.equal(1);
  });

  it("scores barge-ins and backchannels over agent output", function () {
    const r = replayCall(
      call({
        segments: [
          { startMs: 3000, endMs: 3300, text: "uh-huh", kind: "backchannel" },
          { startMs: 5000, endMs: 6500, text: "no wait", kind: "interruption" }
        ],
        agent: [{ startMs: 2000, endMs: 8000, interruptible: true }]
      }),
      baseline
    );
    expect(r).to.include({
      bargeIns: 1,
      missedBargeIns: 0,
      backchannelsOverOutput: 1,
      backchannelMisfires: 1
    });
  });

  it("replays only consented calls", function () {
    const calls = [
      call({ name: "ok" }),
      { ...call({ name: "no" }), consent: "customer" as never }
    ];
    expect(replay(calls, baseline).calls).to.equal(1);
  });

  it("shows the candidate cuts backchannel misfires without regressing on the corpus", function () {
    const b = replay(corpus.calls, baseline);
    const c = replay(
      corpus.calls,
      () => new BackchannelDetector({ silenceTimeoutMs: 600 })
    );
    expect(b.calls).to.equal(60);
    expect(b.backchannelMisfireRate).to.equal(1);
    expect(c.backchannelMisfireRate).to.be.lessThan(0.5);
    expect(c.missedBargeInRate).to.equal(0);
    expect(compare(b, c).pass).to.equal(true);
  });

  it("rejects a candidate that regresses beyond the tolerance", function () {
    const b = replay(corpus.calls, baseline);
    const impatient = replay(
      corpus.calls,
      () => new BaselineDetector({ silenceTimeoutMs: 200 })
    );
    const verdict = compare(b, impatient);
    expect(verdict.pass).to.equal(false);
    expect(verdict.regressions.join()).to.contain("falseCutOffRate");
  });

  it("breaks the metrics down by category and language and lists the calls to listen to", function () {
    const b = replay(corpus.calls, baseline);
    expect(Object.keys(b.byCategory)).to.include.members([
      "clean",
      "long-pause",
      "backchannel",
      "barge-in"
    ]);
    expect(Object.keys(b.byLanguage)).to.include.members(["en", "es"]);
    expect(b.byCategory.clean.falseCutOffRate).to.equal(0);
    expect(b.byCategory["long-pause"].falseCutOffRate).to.equal(1);
    expect(b.problems.some((p) => p.name.includes("long-pause"))).to.equal(
      true
    );
    expect(categoryOf(call({ name: "x", tags: ["noisy"] }))).to.equal("noisy");
  });

  it("replays with the app's patience: more patient, fewer cut-offs and later ends", function () {
    const normal = replay(corpus.calls, baseline);
    const high = replay(corpus.calls, baseline, { patience: "high" });
    expect(high.falseCutOffRate).to.be.lessThan(normal.falseCutOffRate);
    expect(high.delayMedianMs).to.be.greaterThan(normal.delayMedianMs);
  });

  it("formats a report with a verdict per candidate", function () {
    const text = formatReport([
      { name: "baseline", report: replay(corpus.calls, baseline) },
      {
        name: "backchannel-hold",
        report: replay(
          corpus.calls,
          () => new BackchannelDetector({ silenceTimeoutMs: 600 })
        )
      }
    ]);
    expect(text).to.contain("baseline by category");
    expect(text).to.contain("backchannel-hold vs baseline: PASS");
  });
});
