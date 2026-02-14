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
import { isValidIso8601Date } from "./isValidIso8601Date";
import { EvalExpectedTool } from "./types";

type ToolCallLike = { name: string; args?: Record<string, unknown> };

export function evaluateSingleTool(
  expected: EvalExpectedTool,
  actual: ToolCallLike
): ToolEvaluationReport {
  let passed = true;
  let errorMessage = "";

  if (actual.name !== expected.tool) {
    passed = false;
    errorMessage = `Expected tool "${expected.tool}" but got "${actual.name}".`;
  }

  const expectedParams = expected.parameters ?? {};
  const actualParams = actual.args ?? {};

  for (const key of Object.keys(expectedParams)) {
    const expectedVal = expectedParams[key];
    const expectedStr =
      typeof expectedVal === "string"
        ? expectedVal.trim()
        : String(expectedVal).trim();
    if (expectedStr === "valid-date") {
      if (!isValidIso8601Date(actualParams[key])) {
        passed = false;
        const paramMsg = `Expected parameter "${key}" to be a valid date, but got ${JSON.stringify(actualParams[key])}.`;
        errorMessage = errorMessage ? `${errorMessage} ${paramMsg}` : paramMsg;
      }
      continue;
    }

    if (actualParams[key] !== expectedVal) {
      passed = false;
      const paramMsg = `Expected parameter "${key}" to have value ${JSON.stringify(expectedVal)}, but got ${JSON.stringify(actualParams[key])}.`;
      errorMessage = errorMessage ? `${errorMessage} ${paramMsg}` : paramMsg;
    }
  }

  return {
    expectedTool: expected.tool,
    actualTool: actual.name,
    passed,
    expectedParameters: expected.parameters,
    actualParameters: actual.args,
    errorMessage: errorMessage || undefined
  };
}
