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
import { Scenario } from "../scenario/types";
import { RunOptions, runScenario, ScenarioResult } from "./runScenario";

export type Distribution = {
  count: number;
  min: number;
  p50: number;
  p95: number;
  p99: number;
  max: number;
};

/** Nearest-rank percentile. */
export function percentile(values: number[], p: number): number {
  if (!values.length) return NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(sorted.length, Math.max(1, rank)) - 1];
}

export function distribution(values: number[]): Distribution {
  return {
    count: values.length,
    min: Math.min(...values),
    p50: percentile(values, 50),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    max: Math.max(...values)
  };
}

export type RepeatReport = {
  scenario: string;
  runs: number;
  failures: { run: number; reason?: string }[];
  /** Per timed step: elapsed (and provider-adjusted, when budget_ms is used) distributions. */
  steps: Record<string, { elapsed: Distribution; adjusted?: Distribution }>;
  /** Per assert name: distribution of numeric measurements. */
  measurements: Record<string, Distribution>;
};

/**
 * Runs one scenario many times (each with fresh options from `makeOptions`) and reports timing
 * distributions. This is how pass bars are computed (T1: p95 over many runs), as opposed to the
 * loose single-run limits inside the scenario.
 */
export async function repeatScenario(
  scenario: Scenario,
  runs: number,
  makeOptions: (
    run: number
  ) => Promise<{ options: RunOptions; cleanup: () => Promise<void> }>
): Promise<RepeatReport> {
  const results: ScenarioResult[] = [];
  for (let run = 0; run < runs; run++) {
    const { options, cleanup } = await makeOptions(run);
    try {
      results.push(await runScenario(scenario, options));
    } finally {
      await cleanup();
    }
  }

  const steps: Record<string, { elapsed: number[]; adjusted: number[] }> = {};
  const measurements: Record<string, number[]> = {};
  for (const r of results) {
    for (const s of r.samples) {
      const key = s.label ?? `step ${s.step}`;
      steps[key] ??= { elapsed: [], adjusted: [] };
      steps[key].elapsed.push(s.elapsedMs);
      if (s.adjustedMs !== undefined) steps[key].adjusted.push(s.adjustedMs);
    }
    for (const m of r.measurements) {
      if (typeof m.value === "number")
        (measurements[m.name] ??= []).push(m.value);
    }
  }

  return {
    scenario: scenario.name,
    runs,
    failures: results
      .map((r, run) => ({ run, status: r.status, reason: r.reason }))
      .filter((r) => r.status === "failed"),
    steps: Object.fromEntries(
      Object.entries(steps).map(([k, v]) => [
        k,
        {
          elapsed: distribution(v.elapsed),
          ...(v.adjusted.length ? { adjusted: distribution(v.adjusted) } : {})
        }
      ])
    ),
    measurements: Object.fromEntries(
      Object.entries(measurements).map(([k, v]) => [k, distribution(v)])
    )
  };
}
