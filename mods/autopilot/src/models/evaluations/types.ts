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
enum ExpectedTextType {
  EXACT = "exact",
  SIMILAR = "similar"
}

type SessionEvaluationReport = {
  sessionId: string;
  overallPassed: boolean;
  steps: StepEvaluationReport[];
};

type StepEvaluationReport = {
  humanInput: string;
  expectedResponse: string;
  aiResponse: string;
  evaluationType: ExpectedTextType;
  passed: boolean;
  errorMessage?: string;
  toolEvaluations?: ToolEvaluationReport[];
};

type ToolEvaluationReport = {
  expectedTool: string;
  actualTool: string;
  passed: boolean;
  expectedParameters?: Record<string, unknown>;
  actualParameters?: Record<string, unknown>;
  errorMessage?: string;
};

export {
  ExpectedTextType,
  SessionEvaluationReport,
  StepEvaluationReport,
  ToolEvaluationReport
};
