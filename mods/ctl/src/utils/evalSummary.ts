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
import ansis from "ansis";
import type { EvalSummary } from "./printEval";

/** One complete run of an agent's test cases. */
export type EvalRun = EvalSummary;

/** The parts of a test case the summary reads: which steps expect tools. */
export type EvalScenarioShape = {
  ref: string;
  conversation: { expected?: { tools?: unknown[] } }[];
};

export type EvalBars = {
  maxFirstTokenP50?: number;
  maxFirstTokenP95?: number;
  minToolPass?: number;
  minStepPass?: number;
};

export type BarResult = {
  name: string;
  limit: number;
  actual: number | null;
  passed: boolean;
};

export type RunsSummary = {
  runs: number;
  /** From steps that expect no tool; a tool step's first token covers two model requests. */
  firstToken: { samples: number; p50: number | null; p95: number | null };
  steps: { total: number; passed: number; percent: number | null };
  tools: { total: number; passed: number; percent: number | null };
  errors: number;
};

/** Nearest-rank percentile of a list sorted ascending. */
function percentile(sorted: number[], p: number): number | null {
  if (!sorted.length) return null;
  return sorted[Math.max(0, Math.ceil((p / 100) * sorted.length) - 1)];
}

export function summarizeRuns(
  runs: EvalRun[],
  scenarios: EvalScenarioShape[]
): RunsSummary {
  const firstTokens: number[] = [];
  const steps = { total: 0, passed: 0 };
  const tools = { total: 0, passed: 0 };
  let errors = 0;

  for (const run of runs) {
    errors += run.errors.length;
    for (const scenario of run.scenarios) {
      const shape = scenarios.find((s) => s.ref === scenario.scenarioRef);
      scenario.steps.forEach((step, i) => {
        const expected = shape?.conversation[i]?.expected?.tools;
        steps.total++;
        if (step.passed) steps.passed++;
        if (expected) {
          tools.total++;
          // Only tools count here: a right tool still counts when the reply's text missed. An
          // empty expected list has an evaluation only when the model called a tool it shouldn't.
          const evaluations = step.toolEvaluations ?? [];
          const toolsRight =
            (evaluations.length > 0 || !expected.length) &&
            evaluations.every((e) => e.passed);
          if (toolsRight) tools.passed++;
        }
        if (!expected?.length && step.firstTokenMs !== undefined)
          firstTokens.push(step.firstTokenMs);
      });
    }
  }

  firstTokens.sort((a, b) => a - b);
  const percent = (n: { total: number; passed: number }) =>
    n.total ? Math.round((n.passed / n.total) * 1000) / 10 : null;
  return {
    runs: runs.length,
    firstToken: {
      samples: firstTokens.length,
      p50: percentile(firstTokens, 50),
      p95: percentile(firstTokens, 95)
    },
    steps: { ...steps, percent: percent(steps) },
    tools: { ...tools, percent: percent(tools) },
    errors
  };
}

export function checkBars(summary: RunsSummary, bars: EvalBars): BarResult[] {
  const at = (actual: number | null, limit: number) =>
    actual !== null && actual <= limit;
  const results: BarResult[] = [];
  if (bars.maxFirstTokenP50 !== undefined)
    results.push({
      name: "first token p50",
      limit: bars.maxFirstTokenP50,
      actual: summary.firstToken.p50,
      passed: at(summary.firstToken.p50, bars.maxFirstTokenP50)
    });
  if (bars.maxFirstTokenP95 !== undefined)
    results.push({
      name: "first token p95",
      limit: bars.maxFirstTokenP95,
      actual: summary.firstToken.p95,
      passed: at(summary.firstToken.p95, bars.maxFirstTokenP95)
    });
  if (bars.minToolPass !== undefined)
    results.push({
      name: "tool pass %",
      limit: bars.minToolPass,
      actual: summary.tools.percent,
      passed:
        summary.tools.percent !== null &&
        summary.tools.percent >= bars.minToolPass
    });
  if (bars.minStepPass !== undefined)
    results.push({
      name: "step pass %",
      limit: bars.minStepPass,
      actual: summary.steps.percent,
      passed:
        summary.steps.percent !== null &&
        summary.steps.percent >= bars.minStepPass
    });
  return results;
}

/**
 * An eval error always fails. With bars, the bars decide, since a repeated run may allow some
 * misses. Without bars, every scenario must pass.
 */
export function evalPassed(
  runs: EvalRun[],
  summary: RunsSummary,
  bars: BarResult[]
): boolean {
  if (summary.errors > 0) return false;
  if (bars.length) return bars.every((b) => b.passed);
  return runs.every((r) => r.scenarios.every((s) => s.overallPassed));
}

export function printRunsSummary(
  model: string,
  summary: RunsSummary,
  bars: BarResult[]
): void {
  const ms = (v: number | null) => (v === null ? "—" : `${v} ms`);
  console.log(ansis.bold(`\nSummary: ${model} (${summary.runs} runs)`));
  console.log(
    `  First token:  p50 ${ms(summary.firstToken.p50)}, p95 ${ms(summary.firstToken.p95)} (${summary.firstToken.samples} samples)`
  );
  console.log(
    `  Steps:        ${summary.steps.passed}/${summary.steps.total} passed${summary.steps.percent === null ? "" : ` (${summary.steps.percent}%)`}`
  );
  console.log(
    `  Tools:        ${summary.tools.passed}/${summary.tools.total} right${summary.tools.percent === null ? "" : ` (${summary.tools.percent}%)`}`
  );
  console.log(`  Errors:       ${summary.errors}`);
  for (const bar of bars) {
    const mark = bar.passed ? ansis.green("✔") : ansis.red("✘");
    console.log(
      `  ${mark} ${bar.name}: ${bar.actual ?? "no data"} (limit ${bar.limit})`
    );
  }
}
