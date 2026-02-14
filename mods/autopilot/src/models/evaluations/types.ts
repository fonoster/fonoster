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
import { AssistantConfig } from "../../assistants";
import { LanguageModel } from "../types";

type EvalExpectedTool = {
  tool: string;
  parameters?: Record<string, unknown>;
};

type EvalConversationStep = {
  userInput: string;
  expected: {
    text: { type: "EXACT" | "SIMILAR"; response: string };
    tools?: EvalExpectedTool[];
  };
};

type EvalScenario = {
  ref: string;
  description: string;
  telephonyContext: {
    callDirection: string;
    ingressNumber: string;
    callerNumber: string;
    metadata?: Record<string, string>;
  };
  conversation: EvalConversationStep[];
};

type EvaluateIntelligenceRequest = {
  intelligence: {
    productRef: string;
    config: AssistantConfig;
  };
};

type EvaluateStepParams = {
  step: EvalConversationStep;
  languageModel: LanguageModel;
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>;
  assistantConfig: AssistantConfig;
};

type ScenarioEvaluationRequest = {
  assistantConfig: AssistantConfig;
  scenario: EvalScenario;
  languageModel: LanguageModel;
  testTextSimilarity: (text1: string, text2: string) => Promise<boolean>;
};

type RunEvalCallbacks = {
  onStepResult: (
    scenarioRef: string,
    report: StepEvaluationReport
  ) => void | Promise<void>;
  onScenarioComplete: (
    scenarioRef: string,
    overallPassed: boolean
  ) => void | Promise<void>;
};

export {
  EvalConversationStep,
  EvalExpectedTool,
  EvalScenario,
  EvaluateIntelligenceRequest,
  EvaluateStepParams,
  RunEvalCallbacks,
  ScenarioEvaluationRequest
};
