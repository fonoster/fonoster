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
import { Pacing, Patience, TurnEvent } from "./Pacing";

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

export type Metrics = {
  calls: number;
  turns: number;
  falseCutOffRate: number;
  delayMedianMs: number;
  delayP95Ms: number;
  missedBargeInRate: number;
  backchannelMisfireRate: number;
  /** Turns that never got a turn.ended before the next one started. */
  missedEndRate: number;
};

export type ReplayReport = Metrics & {
  results: CallResult[];
  /** The same metrics per category (tags or `<language>-<category>-<n>` names) and language. */
  byCategory: Record<string, Metrics>;
  byLanguage: Record<string, Metrics>;
  /** Calls where something went wrong, with what, to listen to first. */
  problems: { name: string; issues: string[] }[];
};

export type ReplayOptions = {
  language?: string;
  /** The app patience the policy runs with (default normal). */
  patience?: Patience;
  /** Within-call adaptation (default on, as in AppBridge). */
  adapt?: boolean;
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
  options: ReplayOptions = {}
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
    {
      language: options.language ?? call.language,
      patience: options.patience,
      adapt: options.adapt
    }
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

/** The category of a corpus call: its first tag, or the middle of `<language>-<category>-<n>`. */
export function categoryOf(call: CorpusCall): string {
  if (call.tags?.length) return call.tags[0];
  const parts = call.name.split("-");
  return parts.length >= 3 ? parts.slice(1, -1).join("-") : "other";
}

function metrics(results: CallResult[]): Metrics {
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
    missedEndRate: ratio(
      sum((r) => r.missedEnds),
      turns
    )
  };
}

function groupBy(
  calls: CorpusCall[],
  results: CallResult[],
  key: (c: CorpusCall) => string
): Record<string, Metrics> {
  const groups = new Map<string, CallResult[]>();
  calls.forEach((c, i) => {
    const k = key(c);
    groups.set(k, [...(groups.get(k) ?? []), results[i]]);
  });
  return Object.fromEntries(
    [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, rs]) => [k, metrics(rs)])
  );
}

function issuesOf(r: CallResult): string[] {
  const issues: string[] = [];
  if (r.falseCutOffs) issues.push(`${r.falseCutOffs} false cut-off`);
  if (r.missedEnds) issues.push(`${r.missedEnds} missed end`);
  if (r.missedBargeIns) issues.push(`${r.missedBargeIns} missed barge-in`);
  if (r.backchannelMisfires)
    issues.push(`${r.backchannelMisfires} backchannel misfire`);
  return issues;
}

export function replay(
  calls: CorpusCall[],
  makeDetector: () => Detector,
  options: ReplayOptions = {}
): ReplayReport {
  const consented = calls.filter((c) =>
    ["synthetic", "internal", "customer-opt-in"].includes(c.consent)
  );
  const results = consented.map((c) => replayCall(c, makeDetector, options));
  return {
    ...metrics(results),
    results,
    byCategory: groupBy(consented, results, categoryOf),
    byLanguage: groupBy(consented, results, (c) => c.language),
    problems: results
      .map((r) => ({ name: r.name, issues: issuesOf(r) }))
      .filter((p) => p.issues.length)
  };
}

const COLUMNS: [keyof Metrics, string][] = [
  ["falseCutOffRate", "false cut-off"],
  ["delayMedianMs", "delay p50 ms"],
  ["delayP95Ms", "delay p95 ms"],
  ["missedBargeInRate", "missed barge-in"],
  ["backchannelMisfireRate", "backchannel misfire"],
  ["missedEndRate", "missed end"]
];

function table(rows: [string, Metrics][]): string {
  const header = ["", ...COLUMNS.map(([, h]) => h)];
  const body = rows.map(([name, m]) => [
    name,
    ...COLUMNS.map(([k]) => String(m[k]))
  ]);
  const widths = header.map((_, i) =>
    Math.max(...[header, ...body].map((r) => r[i].length))
  );
  const line = (r: string[]) =>
    r
      .map((c, i) => c.padEnd(widths[i]))
      .join("  ")
      .trimEnd();
  return [line(header), ...body.map(line)].join("\n");
}

/**
 * A plain-text report: overall metrics per Detector, the breakdown per category for each, the
 * calls to listen to, and the verdict of each candidate against the first (the default).
 */
export function formatReport(
  reports: { name: string; report: ReplayReport }[],
  tolerance?: Tolerance
): string {
  const [base, ...candidates] = reports;
  const out: string[] = [
    `${base.report.calls} calls, ${base.report.turns} turns`,
    "",
    table(reports.map((r) => [r.name, r.report]))
  ];
  for (const r of reports) {
    out.push(
      "",
      `${r.name} by category`,
      table(Object.entries(r.report.byCategory))
    );
    if (r.report.problems.length)
      out.push(
        "",
        `${r.name}: calls to listen to`,
        ...r.report.problems
          .slice(0, 10)
          .map((p) => `  ${p.name}: ${p.issues.join(", ")}`),
        ...(r.report.problems.length > 10
          ? [`  and ${r.report.problems.length - 10} more`]
          : [])
      );
  }
  for (const c of candidates) {
    const verdict = compare(base.report, c.report, tolerance);
    out.push(
      "",
      `${c.name} vs ${base.name}: ${verdict.pass ? "PASS (may become the default)" : "FAIL"}`,
      ...verdict.regressions.map((r) => `  ${r}`)
    );
  }
  return out.join("\n");
}

export type Tolerance = { rate: number; delayMs: number };

/** A candidate may replace the default only if it regresses on no metric beyond the tolerance. */
export function compare(
  baseline: Metrics,
  candidate: Metrics,
  tolerance: Tolerance = { rate: 0.02, delayMs: 100 }
) {
  const regressions: string[] = [];
  const rate = (name: keyof Metrics) => {
    const b = baseline[name] as number;
    const c = candidate[name] as number;
    if (c > b + tolerance.rate)
      regressions.push(
        `${String(name)} ${c} > baseline ${b} + ${tolerance.rate}`
      );
  };
  const delay = (name: keyof Metrics) => {
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
  rate("missedEndRate");
  return { pass: regressions.length === 0, regressions };
}
