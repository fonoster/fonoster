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
import moment from "moment";

export function evaluateToolCalls(
  expectedTools: any[],
  toolCalls: any[] | undefined
): {
  evaluations: ToolEvaluationReport[];
  passed: boolean;
  errorMessage?: string;
} {
  const evaluations: ToolEvaluationReport[] = [];
  let overallPassed = true;

  if (!toolCalls || toolCalls.length !== expectedTools.length) {
    overallPassed = false;
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
      passed: overallPassed,
      errorMessage: `Tool invocation count mismatch.`
    };
  }

  for (let i = 0; i < expectedTools.length; i++) {
    const expectedTool = expectedTools[i];
    const actualCall = toolCalls[i];
    let toolPassed = true;
    let errorMessage = "";

    if (actualCall.name !== expectedTool.tool) {
      toolPassed = false;
      errorMessage = `Expected tool "${expectedTool.tool}" but got "${actualCall.name}".`;
    }

    const expectedParams = expectedTool.parameters || {};
    const actualParams = actualCall.args || {};

    for (const key of Object.keys(expectedParams)) {
      // Check for the special case of a valid-date
      if (expectedParams[key].trim() === "valid-date") {
        actualParams[key] = moment(actualParams[key], moment.ISO_8601, true);

        if (!actualParams[key].isValid()) {
          toolPassed = false;
          const paramMsg = `Expected parameter "${key}" to be a valid date, but got ${JSON.stringify(actualParams[key])}.`;
          errorMessage = errorMessage
            ? errorMessage + " " + paramMsg
            : paramMsg;
        }
        continue;
      }

      if (actualParams[key] !== expectedParams[key]) {
        toolPassed = false;
        const paramMsg = `Expected parameter "${key}" to have value ${JSON.stringify(expectedParams[key])}, but got ${JSON.stringify(actualParams[key])}.`;
        errorMessage = errorMessage ? errorMessage + " " + paramMsg : paramMsg;
      }
    }

    if (!toolPassed) {
      overallPassed = false;
    }

    evaluations.push({
      expectedTool: expectedTool.tool,
      actualTool: actualCall.name,
      passed: toolPassed,
      expectedParameters: expectedTool.parameters,
      actualParameters: actualCall.args,
      errorMessage: errorMessage || undefined
    });
  }
  return {
    evaluations,
    passed: overallPassed,
    errorMessage: overallPassed
      ? undefined
      : "One or more tool evaluations failed."
  };
}
