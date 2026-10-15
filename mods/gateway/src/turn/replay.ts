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
import { FRAME_BYTES, FRAME_MS } from "../audio/pcm";
import { CorpusCall } from "./corpus";
import { Detector } from "./Detector";
import { Pacing, TurnEvent } from "./Pacing";

// Replays corpus calls through a Detector and the Pacing policy and scores the decisions
// (add-turn-taking task 1.6, conformance pass bar T3).

const VOICE = (() => {
  const b = Buffer.alloc(FRAME_BYTES);
  for (let i = 0; i < FRAME_BYTES / 2; i++)
    b.writeInt16LE(Math.round(6000 * Math.sin(i / 3)), i * 2);
  return b;
})();
const SILENCE = Buffer.alloc(FRAME_BYTES);

export type CallResult = {
  name: string;
  /** Turns ended while the caller's turn was still going (a pause taken for an end). */
  falseCutOffs: number;
  /** Per turn: ms from the true end to turn.ended (missing when never ended). */
  delays: number[];
  missedEnds: number;
  bargeIns: number;
  missedBargeIns: number;
  backchannelsOverOutput: number;
  backchannelMisfires: number;
};

export type ReplayReport = {
  calls: number;
  turns: number;
  falseCutOffRate: number;
  delayMedianMs: number;
  delayP95Ms: number;
  missedBargeInRate: number;
  backchannelMisfireRate: number;
  results: CallResult[];
};

function percentile(values: number[], p: number) {
  if (!values.length) return 0;
  const s = [...values].sort((a, b) => a - b);
  return s[
    Math.min(s.length, Math.max(1, Math.ceil((p / 100) * s.length))) - 1
  ];
}

export function replayCall(
  call: CorpusCall,
  makeDetector: () => Detector,
  options: { language?: string } = {}
): CallResult {
  const turnEnds: number[] = [];
  const interruptions: number[] = [];
  const detector = makeDetector();
  const pacing = new Pacing(
    detector,
    {
      turn: (e: TurnEvent) => {
        if (e.type === "turn.ended") turnEnds.push(now);
      },
      partial: () => undefined,
      estimate: () => undefined,
      interruption: () => interruptions.push(now)
    },
    { language: options.language ?? call.language }
  );

  const latency = call.sttLatencyMs ?? 300;
  const lastMs =
    Math.max(
      ...call.segments.map((s) => s.endMs),
      ...call.agent.map((a) => a.endMs)
    ) + 3000;
  const transcripts = call.segments
    .map((s) => ({ at: s.endMs + latency, text: s.text }))
    .sort((a, b) => a.at - b.at);
  let nextTranscript = 0;
  let now = 0;
  let playing = false;

  for (now = 0; now <= lastMs; now += FRAME_MS) {
    const out = call.agent.some((a) => now >= a.startMs && now < a.endMs);
    if (out !== playing) {
      playing = out;
      pacing.onOutput(out);
    }
    while (
      nextTranscript < transcripts.length &&
      transcripts[nextTranscript].at <= now
    ) {
      const t = transcripts[nextTranscript++];
      pacing.onTranscript(
        { text: t.text, final: true, language: call.language, confidence: 0.9 },
        now
      );
    }
    const speaking = call.segments.some(
      (s) => now >= s.startMs && now < s.endMs
    );
    pacing.onAudio(speaking ? VOICE : SILENCE, now);
  }

  // Score against the truth.
  const turns = new Map<number, { start: number; end: number }>();
  for (const s of call.segments.filter((s) => s.kind === "turn")) {
    const t = turns.get(s.turn ?? 0) ?? { start: s.startMs, end: s.endMs };
    t.start = Math.min(t.start, s.startMs);
    t.end = Math.max(t.end, s.endMs);
    turns.set(s.turn ?? 0, t);
  }
  const result: CallResult = {
    name: call.name,
    falseCutOffs: 0,
    delays: [],
    missedEnds: 0,
    bargeIns: 0,
    missedBargeIns: 0,
    backchannelsOverOutput: 0,
    backchannelMisfires: 0
  };
  const ordered = [...turns.values()].sort((a, b) => a.start - b.start);
  ordered.forEach((t, i) => {
    const next = ordered[i + 1]?.start ?? Infinity;
    if (turnEnds.some((e) => e > t.start && e < t.end)) result.falseCutOffs++;
    const ended = turnEnds.find((e) => e >= t.end && e < next);
    if (ended === undefined) result.missedEnds++;
    else result.delays.push(ended - t.end);
  });
  const overOutput = (s: { startMs: number; endMs: number }) =>
    call.agent.some(
      (a) => a.interruptible && s.startMs < a.endMs && s.endMs > a.startMs
    );
  for (const s of call.segments) {
    if (!overOutput(s)) continue;
    const fired = interruptions.some(
      (i) => i >= s.startMs && i <= s.endMs + 200
    );
    if (s.kind === "interruption") {
      result.bargeIns++;
      if (!fired) result.missedBargeIns++;
    } else if (s.kind === "backchannel") {
      result.backchannelsOverOutput++;
      if (fired) result.backchannelMisfires++;
    }
  }
  return result;
}

export function replay(
  calls: CorpusCall[],
  makeDetector: () => Detector
): ReplayReport {
  const consented = calls.filter((c) =>
    ["synthetic", "internal", "customer-opt-in"].includes(c.consent)
  );
  const results = consented.map((c) => replayCall(c, makeDetector));
  const sum = (f: (r: CallResult) => number) =>
    results.reduce((a, r) => a + f(r), 0);
  const turns = sum((r) => r.delays.length + r.missedEnds);
  const delays = results.flatMap((r) => r.delays);
  const ratio = (a: number, b: number) => (b ? +(a / b).toFixed(4) : 0);
  return {
    calls: results.length,
    turns,
    falseCutOffRate: ratio(
      sum((r) => r.falseCutOffs),
      turns
    ),
    delayMedianMs: percentile(delays, 50),
    delayP95Ms: percentile(delays, 95),
    missedBargeInRate: ratio(
      sum((r) => r.missedBargeIns),
      sum((r) => r.bargeIns)
    ),
    backchannelMisfireRate: ratio(
      sum((r) => r.backchannelMisfires),
      sum((r) => r.backchannelsOverOutput)
    ),
    results
  };
}

export type Tolerance = { rate: number; delayMs: number };

/** A candidate may replace the default only if it regresses on no metric beyond the tolerance. */
export function compare(
  baseline: ReplayReport,
  candidate: ReplayReport,
  tolerance: Tolerance = { rate: 0.02, delayMs: 100 }
) {
  const regressions: string[] = [];
  const rate = (name: keyof ReplayReport) => {
    const b = baseline[name] as number;
    const c = candidate[name] as number;
    if (c > b + tolerance.rate)
      regressions.push(
        `${String(name)} ${c} > baseline ${b} + ${tolerance.rate}`
      );
  };
  const delay = (name: keyof ReplayReport) => {
    const b = baseline[name] as number;
    const c = candidate[name] as number;
    if (c > b + tolerance.delayMs)
      regressions.push(
        `${String(name)} ${c} ms > baseline ${b} ms + ${tolerance.delayMs} ms`
      );
  };
  rate("falseCutOffRate");
  delay("delayMedianMs");
  delay("delayP95Ms");
  rate("missedBargeInRate");
  rate("backchannelMisfireRate");
  return { pass: regressions.length === 0, regressions };
}
