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
import chalk from "chalk";
import Table from "cli-table3";
import { ScenarioEvaluationReport } from "./types";

export function printEval(results: ScenarioEvaluationReport[]): void {
  results.forEach((result) => {
    console.log(chalk.bold.blue(`\nScenario: ${result.scenarioRef}`));
    console.log(
      chalk.bold(
        `Overall Passed: ${result.overallPassed ? chalk.green("✔") : chalk.red("✘")}`
      )
    );

    const table = new Table({
      head: [
        "Step",
        "Human Input",
        "Expected",
        "AI Response",
        "Tool Calls",
        "Passed"
      ],
      colWidths: [
        6, // Step
        28, // Human Input
        28, // Expected
        28, // AI Response
        null, // Tool Calls - dynamic width
        8 // Passed
      ],
      wordWrap: true
    });

    result.steps.forEach((step, index) => {
      // Format tool evaluations if they exist
      let toolEvalText = "";
      if (step.toolEvaluations && step.toolEvaluations.length > 0) {
        toolEvalText = step.toolEvaluations
          .map((toolEval) => {
            if (!Object.keys(toolEval.actualParameters || {}).length) {
              return `${toolEval.actualTool}()`;
            }
            const params = JSON.stringify(
              toolEval.actualParameters || {},
              null,
              1
            )
              .split("\n")
              .map((line, index, arr) => {
                if (index === 0) return "";
                if (index === arr.length - 1) return "";
                return " " + line.trim();
              })
              .join("\n");
            return `${toolEval.actualTool}({${params}})`;
          })
          .join("\n\n"); // Add extra line between multiple tool calls
      }

      table.push([
        index + 1,
        step.humanInput,
        step.expectedResponse,
        step.aiResponse,
        toolEvalText,
        step.passed ? chalk.green("✔") : chalk.red("✘")
      ]);

      // Print error message if step failed
      if (!step.passed && step.errorMessage) {
        console.log(chalk.red(`\nError in step ${index + 1}:`));
        console.log(chalk.red(step.errorMessage));
      }

      // Print tool evaluation errors if any
      if (step.toolEvaluations) {
        step.toolEvaluations.forEach((toolEval) => {
          if (!toolEval.passed && toolEval.errorMessage) {
            console.log(chalk.red(`\nTool Error in step ${index + 1}:`));
            console.log(chalk.red(toolEval.errorMessage));
          }
        });
      }
    });

    console.log(table.toString());
  });
}
