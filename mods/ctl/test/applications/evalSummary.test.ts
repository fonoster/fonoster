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
  checkBars,
  evalPassed,
  EvalRun,
  summarizeRuns
} from "../../src/utils/evalSummary";

const step = (
  passed: boolean,
  firstTokenMs?: number,
  toolPassed?: boolean
) => ({
  humanInput: "h",
  expectedResponse: "e",
  aiResponse: "a",
  evaluationType: "EXACT",
  passed,
  firstTokenMs,
  toolEvaluations:
    toolPassed === undefined
      ? []
      : [{ expectedTool: "t", actualTool: "t", passed: toolPassed }]
});

const run = (
  steps: ReturnType<typeof step>[],
  errors: string[] = [],
  overallPassed = steps.every((s) => s.passed)
) =>
  ({
    scenarios: [{ scenarioRef: "s1", overallPassed, steps }],
    errors
  }) as unknown as EvalRun;

const scenarios = (...tools: (unknown[] | undefined)[]) => [
  {
    ref: "s1",
    conversation: tools.map((t) => ({ expected: { tools: t } }))
  }
];

describe("@fonoster/ctl eval summary", function () {
  it("reports first token percentiles from steps that expect no tool", function () {
    const runs = [10, 20, 30, 40, 1000].map((ms) =>
      run([step(true, ms), step(true, 5000, true)])
    );
    const summary = summarizeRuns(runs, scenarios(undefined, [{ tool: "t" }]));
    expect(summary.firstToken).to.deep.equal({
      samples: 5,
      p50: 30,
      p95: 1000
    });
  });

  it("counts a step with an explicit empty tool list as a tool step", function () {
    const summary = summarizeRuns(
      [run([step(true, 10), step(true, 20)])],
      scenarios([], undefined)
    );
    expect(summary.tools).to.deep.equal({ total: 1, passed: 1, percent: 100 });
    expect(summary.firstToken.samples).to.equal(2);
  });

  it("counts a failed tool evaluation and a missing one as wrong", function () {
    const summary = summarizeRuns(
      [run([step(false, undefined, false), step(false, 10)], [], false)],
      scenarios([{ tool: "t" }], [{ tool: "t" }])
    );
    expect(summary.tools).to.deep.equal({ total: 2, passed: 0, percent: 0 });
    expect(summary.steps).to.deep.equal({ total: 2, passed: 0, percent: 0 });
  });

  it("does not count a text failure against tools on a step that expects none", function () {
    const summary = summarizeRuns(
      [run([step(false, 10)], [], false)],
      scenarios([])
    );
    expect(summary.tools.passed).to.equal(1);
  });

  it("checks the step bar", function () {
    const summary = summarizeRuns(
      [run([step(true, 10), step(false, 10)], [], false)],
      scenarios(undefined, undefined)
    );
    expect(checkBars(summary, { minStepPass: 90 })).to.deep.equal([
      { name: "step pass %", limit: 90, actual: 50, passed: false }
    ]);
  });

  it("does not count a text failure against tools when the tool was right", function () {
    const summary = summarizeRuns(
      [run([step(false, undefined, true)], [], false)],
      scenarios([{ tool: "t" }])
    );
    expect(summary.tools.passed).to.equal(1);
  });

  it("checks only the bars it is given", function () {
    const summary = summarizeRuns(
      [run([step(true, 800)])],
      scenarios(undefined)
    );
    expect(checkBars(summary, {})).to.deep.equal([]);
    expect(checkBars(summary, { maxFirstTokenP50: 700 })).to.deep.equal([
      { name: "first token p50", limit: 700, actual: 800, passed: false }
    ]);
  });

  it("fails a speed bar with no samples instead of passing it", function () {
    const summary = summarizeRuns([run([])], []);
    expect(checkBars(summary, { maxFirstTokenP50: 700 })[0].passed).to.equal(
      false
    );
  });

  it("without bars, any failed scenario fails the eval", function () {
    const ok = run([step(true, 10)]);
    const bad = run([step(false, 10)]);
    const s = scenarios(undefined);
    expect(evalPassed([ok], summarizeRuns([ok], s), [])).to.equal(true);
    expect(evalPassed([ok, bad], summarizeRuns([ok, bad], s), [])).to.equal(
      false
    );
  });

  it("with bars, the bars decide, because a repeated run allows some misses", function () {
    const ok = run([step(true, 10)]);
    const bad = run([step(false, 10)]);
    const s = scenarios(undefined);
    const summary = summarizeRuns([ok, bad], s);
    const bars = checkBars(summary, { maxFirstTokenP50: 700 });
    expect(evalPassed([ok, bad], summary, bars)).to.equal(true);
  });

  it("an eval error always fails", function () {
    const failed = run([step(true, 10)], ["no key"]);
    const s = scenarios(undefined);
    const summary = summarizeRuns([failed], s);
    const bars = checkBars(summary, { maxFirstTokenP50: 700 });
    expect(summary.errors).to.equal(1);
    expect(evalPassed([failed], summary, bars)).to.equal(false);
  });
});
