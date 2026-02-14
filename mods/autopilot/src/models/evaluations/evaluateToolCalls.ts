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
import { ToolEvaluationReport } from "@fonoster/types";
import { evaluateSingleTool } from "./evaluateSingleTool";
import { EvalExpectedTool } from "./types";

type ToolCallLike = { name: string; args?: Record<string, unknown> };

export function evaluateToolCalls(
  expectedTools: EvalExpectedTool[],
  toolCalls: ToolCallLike[] | undefined
): {
  evaluations: ToolEvaluationReport[];
  passed: boolean;
  errorMessage?: string;
} {
  const evaluations: ToolEvaluationReport[] = [];

  if (!toolCalls || toolCalls.length !== expectedTools.length) {
    evaluations.push({
      expectedTool: "",
      actualTool: "",
      passed: false,
      expectedParameters: undefined,
      actualParameters: undefined,
      errorMessage: `Expected ${expectedTools.length} tool invocation(s), but got ${toolCalls ? toolCalls.length : 0}.`
    });
    return {
      evaluations,
      passed: false,
      errorMessage: "Tool invocation count mismatch."
    };
  }

  for (let i = 0; i < expectedTools.length; i++) {
    evaluations.push(
      evaluateSingleTool(expectedTools[i], toolCalls[i] as ToolCallLike)
    );
  }

  const overallPassed = evaluations.every((e) => e.passed);
  return {
    evaluations,
    passed: overallPassed,
    errorMessage: overallPassed
      ? undefined
      : "One or more tool evaluations failed."
  };
}
