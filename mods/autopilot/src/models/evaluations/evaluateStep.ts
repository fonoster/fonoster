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
import { StepEvaluationReport } from "@fonoster/types";
import { evaluateTextResponse } from "./evaluateTextResponse";
import { evaluateToolCalls } from "./evaluateToolCalls";
import { EvaluateStepParams } from "./types";

export async function evaluateStep({
  step,
  languageModel,
  testTextSimilarity,
  assistantConfig
}: EvaluateStepParams): Promise<StepEvaluationReport> {
  const stepResult: StepEvaluationReport = {
    humanInput: step.userInput,
    expectedResponse: step.expected.text.response,
    aiResponse: "", // will be filled if invoke is successful
    evaluationType: step.expected.text.type,
    passed: true
  };

  try {
    const response = await languageModel.invoke(step.userInput);

    // Hangup and transfer are special cases
    if (response.toolCalls && response.toolCalls.length > 0) {
      const topTool = response.toolCalls[0];
      if (topTool.name === "hangup") {
        stepResult.aiResponse =
          assistantConfig.conversationSettings?.goodbyeMessage || "";
      } else if (topTool.name === "transfer") {
        stepResult.aiResponse =
          assistantConfig.conversationSettings?.transferOptions?.message ?? "";
      } else {
        stepResult.aiResponse = response.content ?? "";
      }
    } else {
      stepResult.aiResponse = response.content ?? "";
    }

    const textEvaluation = await evaluateTextResponse(
      step.expected.text,
      stepResult.aiResponse,
      testTextSimilarity
    );

    if (!textEvaluation.passed) {
      stepResult.passed = false;
      stepResult.errorMessage = textEvaluation.errorMessage;
    }

    if (step.expected.tools && step.expected.tools.length > 0) {
      const toolsEvaluation = evaluateToolCalls(
        step.expected.tools,
        response.toolCalls
      );
      stepResult.toolEvaluations = toolsEvaluation.evaluations;
      if (!toolsEvaluation.passed) {
        stepResult.passed = false;
        stepResult.errorMessage = stepResult.errorMessage
          ? `${stepResult.errorMessage} ${toolsEvaluation.errorMessage}`
          : toolsEvaluation.errorMessage;
      }
    }
  } catch (error) {
    stepResult.passed = false;
    stepResult.errorMessage = `Language model error for input "${step.userInput}": ${error}`;
  }
  return stepResult;
}
