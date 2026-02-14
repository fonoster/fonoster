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
import type {
  EvaluateIntelligenceEvent,
  ScenarioEvaluationReport,
  StepEvaluationReport
} from "@fonoster/types";

export type EvalSummary = {
  scenarios: ScenarioEvaluationReport[];
  errors: string[];
};

/**
 * Builds a single JSON summary from streamed eval events.
 */
export function buildEvalSummary(
  events: EvaluateIntelligenceEvent[]
): EvalSummary {
  const scenariosByRef = new Map<string, ScenarioEvaluationReport>();
  const errors: string[] = [];

  for (const event of events) {
    if (event.type === "stepResult") {
      let scenario = scenariosByRef.get(event.scenarioRef);
      if (!scenario) {
        scenario = {
          scenarioRef: event.scenarioRef,
          overallPassed: false,
          steps: []
        };
        scenariosByRef.set(event.scenarioRef, scenario);
      }
      scenario.steps.push(event.stepResult);
    } else if (event.type === "scenarioSummary") {
      const scenario = scenariosByRef.get(event.scenarioRef);
      if (scenario) scenario.overallPassed = event.overallPassed;
    } else if (event.type === "evalError") {
      errors.push(event.message);
    }
  }

  return {
    scenarios: Array.from(scenariosByRef.values()),
    errors
  };
}

function formatToolCalls(step: StepEvaluationReport): string {
  if (!step.toolEvaluations?.length) return "—";
  return step.toolEvaluations
    .map((toolEval) => {
      if (!Object.keys(toolEval.actualParameters || {}).length) {
        return `${toolEval.actualTool}()`;
      }
      const params = JSON.stringify(toolEval.actualParameters || {}, null, 1)
        .split("\n")
        .map((line, idx, arr) => {
          if (idx === 0 || idx === arr.length - 1) return "";
          return " " + line.trim();
        })
        .join("\n");
      return `${toolEval.actualTool}({${params}})`;
    })
    .join(" ");
}

const LABEL_PAD = 14; // "AI Expected:  " etc.

function formatLine(label: string, value: string): string {
  return `  ${(label + ":").padEnd(LABEL_PAD + 1)} ${value.replace(/\n/g, " ")}`;
}

/**
 * Prints a single step result in vertical layout (Step, Human, AI Expected, AI Actual, Tool, Passed).
 */
export function printStepResult(
  _scenarioRef: string,
  stepIndex: number,
  step: StepEvaluationReport
): void {
  if (stepIndex > 0) console.log("");

  const toolText = formatToolCalls(step);
  const passedStr = step.passed
    ? ansis.green("✔ Passed")
    : ansis.red("✘ Failed");

  console.log(ansis.bold(`  Step: ${stepIndex + 1}`));
  console.log(formatLine("Human", step.humanInput || "—"));
  console.log(formatLine("AI Expected", step.expectedResponse || "—"));
  console.log(formatLine("AI Actual", step.aiResponse || "(none)"));
  console.log(formatLine("Tool", toolText));
  console.log(formatLine("Passed", passedStr));

  if (!step.passed && step.errorMessage) {
    console.log(ansis.red(`    ${step.errorMessage}`));
  }
  if (step.toolEvaluations) {
    for (const toolEval of step.toolEvaluations) {
      if (!toolEval.passed && toolEval.errorMessage) {
        console.log(ansis.red(`    Tool: ${toolEval.errorMessage}`));
      }
    }
  }
}

/**
 * Prints scenario header (call once before first step of a scenario).
 */
export function printScenarioHeader(scenarioRef: string): void {
  console.log("");
  console.log(ansis.bold.blue(`Scenario: ${scenarioRef}`));
  console.log(
    ansis.dim("—".repeat(Math.min(60, process.stdout.columns || 60)))
  );
}

/**
 * Prints scenario completion summary.
 */
export function printScenarioSummary(
  scenarioRef: string,
  overallPassed: boolean
): void {
  console.log(
    ansis.bold(
      `  Overall: ${overallPassed ? ansis.green("✔ Passed") : ansis.red("✘ Failed")}`
    )
  );
}

/**
 * Prints an eval error event.
 */
export function printEvalError(message: string): void {
  console.log("");
  console.log(ansis.red("— Eval error —"));
  console.log(ansis.red(`  ${message}`));
}
