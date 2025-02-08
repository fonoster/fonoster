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
import { LanguageModel } from "../types";
import {
  ExpectedTextType,
  SessionEvaluationReport,
  StepEvaluationReport,
  ToolEvaluationReport
} from "./types";

export async function evaluateSession(
  session: any,
  languageModel: LanguageModel,
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>
): Promise<SessionEvaluationReport> {
  const results: StepEvaluationReport[] = [];

  for (const step of session.conversation) {
    const stepResult: StepEvaluationReport = {
      humanInput: step.userInput,
      expectedResponse: step.expected.text.response,
      aiResponse: "", // will be filled if invoke is successful
      evaluationType: step.expected.text.type,
      passed: true
    };

    let response;
    try {
      response = await languageModel.invoke(step.userInput);
      stepResult.aiResponse = response.content;

      if (step.expected.text.type === ExpectedTextType.EXACT) {
        if (response.content !== step.expected.text.response) {
          stepResult.passed = false;
          stepResult.errorMessage = `Expected exact response "${step.expected.text.response}", but got "${response.content}".`;
        }
      } else if (step.expected.text.type === ExpectedTextType.SIMILAR) {
        const isSimilar = await testTextSimilarity(
          step.expected.text.response,
          response.content
        );

        if (!isSimilar) {
          stepResult.passed = false;
          stepResult.errorMessage = `Expected similar response to "${step.expected.text.response}", but got "${response.content}".`;
        }
      }

      // Evaluate tools if expected
      if (step.expected.tools && step.expected.tools.length > 0) {
        stepResult.toolEvaluations = [];

        if (
          !response.toolCalls ||
          response.toolCalls.length !== step.expected.tools.length
        ) {
          stepResult.passed = false;
          stepResult.toolEvaluations.push({
            expectedTool: "", // no specific tool comparison possible
            actualTool: "",
            passed: false,
            expectedParameters: undefined,
            actualParameters: response.toolCalls
              ? response.toolCalls.length
              : 0,
            errorMessage: `Expected ${step.expected.tools.length} tool invocation(s), but got ${
              response.toolCalls ? response.toolCalls.length : 0
            }.`
          });
        } else {
          for (let i = 0; i < step.expected.tools.length; i++) {
            const expectedTool = step.expected.tools[i];
            const actualCall = response.toolCalls[i];
            const toolResult: ToolEvaluationReport = {
              expectedTool: expectedTool.tool,
              actualTool: actualCall.name,
              passed: true,
              expectedParameters: expectedTool.parameters,
              actualParameters: actualCall.args
            };

            if (actualCall.name !== expectedTool.tool) {
              toolResult.passed = false;
              toolResult.errorMessage = `Expected tool "${expectedTool.tool}" but got "${actualCall.name}".`;
              stepResult.passed = false;
            }

            // Check only the keys in the expected parameters list
            const expectedParams = expectedTool.parameters || {};
            const actualParams = actualCall.args || {};

            for (const key of Object.keys(expectedParams)) {
              if (actualParams[key] !== expectedParams[key]) {
                toolResult.passed = false;
                const msg = `Expected parameter "${key}" to have value ${JSON.stringify(
                  expectedParams[key]
                )}, but got ${JSON.stringify(actualParams[key])}.`;
                toolResult.errorMessage = toolResult.errorMessage
                  ? toolResult.errorMessage + " " + msg
                  : msg;
                stepResult.passed = false;
              }
            }

            stepResult.toolEvaluations.push(toolResult);
          }
        }
      }
    } catch (error) {
      stepResult.passed = false;
      stepResult.errorMessage = `Language model error for input "${step.userInput}": ${error}`;
    }

    results.push(stepResult);
  }

  const overallPassed = results.every((step) => step.passed);

  return {
    sessionId: session.id,
    overallPassed,
    steps: results
  };
}
