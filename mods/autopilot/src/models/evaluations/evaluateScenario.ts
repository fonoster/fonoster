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
import {
  ScenarioEvaluationReport,
  StepEvaluationReport
} from "@fonoster/types";
import { evaluateStep } from "./evaluateStep";
import { ScenarioEvaluationRequest } from "./types";

export async function evaluateScenario(
  config: ScenarioEvaluationRequest
): Promise<ScenarioEvaluationReport> {
  const { scenario, languageModel, testTextSimilarity, assistantConfig } =
    config;
  const results: StepEvaluationReport[] = [];

  for (const step of scenario.conversation) {
    const stepResult = await evaluateStep({
      step,
      languageModel,
      testTextSimilarity,
      assistantConfig
    });
    results.push(stepResult);
  }

  const overallPassed = results.every((step) => step.passed);

  return {
    scenarioRef: scenario.ref,
    overallPassed,
    steps: results
  };
}
