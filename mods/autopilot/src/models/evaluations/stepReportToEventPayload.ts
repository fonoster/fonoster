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
  ExpectedTextType,
  StepEvaluationReport,
  ToolEvaluationReport
} from "@fonoster/types";

const EVALUATION_TYPE_TO_NUM: Record<string, number> = {
  [ExpectedTextType.EXACT]: 0,
  [ExpectedTextType.SIMILAR]: 1
};

function toolReportToPayload(t: ToolEvaluationReport): Record<string, unknown> {
  return {
    expectedTool: t.expectedTool,
    actualTool: t.actualTool,
    passed: t.passed,
    expectedParameters: t.expectedParameters,
    actualParameters: t.actualParameters,
    errorMessage: t.errorMessage ?? ""
  };
}

/**
 * Converts StepEvaluationReport to the wire payload shape expected by the gRPC stream
 * (camelCase, evaluationType as number for proto).
 */
export function stepReportToEventPayload(
  scenarioRef: string,
  report: StepEvaluationReport
): Record<string, unknown> {
  return {
    stepResult: {
      scenarioRef,
      report: {
        humanInput: report.humanInput,
        expectedResponse: report.expectedResponse,
        aiResponse: report.aiResponse,
        evaluationType: EVALUATION_TYPE_TO_NUM[report.evaluationType] ?? 0,
        passed: report.passed,
        errorMessage: report.errorMessage ?? "",
        toolEvaluations: (report.toolEvaluations ?? []).map(toolReportToPayload)
      }
    }
  };
}

export function scenarioSummaryToEventPayload(
  scenarioRef: string,
  overallPassed: boolean
): Record<string, unknown> {
  return {
    scenarioSummary: {
      scenarioRef,
      overallPassed
    }
  };
}

export function evalErrorToEventPayload(
  message: string
): Record<string, unknown> {
  return {
    evalError: {
      message
    }
  };
}
