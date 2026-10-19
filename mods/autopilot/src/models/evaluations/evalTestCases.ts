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
import { ScenarioEvaluationReport } from "@fonoster/types";
import { Voice } from "../../voice";
import { createLanguageModel } from "../createLanguageModel";
import { EvalAgent, TelephonyContext } from "../types";
import { createTestTextSimilarity } from "./createTestTextSimilarity";
import { evaluateScenario } from "./evaluateScenario";
import { textSimilaryPrompt } from "./textSimilaryPrompt";
import { EvalScenario } from "./types";

export async function evalTestCases(autopilotApplication: {
  intelligence: {
    config: EvalAgent;
  };
}): Promise<ScenarioEvaluationReport[]> {
  const { testCases } = autopilotApplication.intelligence.config;
  const { config: agentConfig } = autopilotApplication.intelligence;
  const voice = {
    say: async (_: string) => {}
  } as Voice;

  const evaluationReports: ScenarioEvaluationReport[] = [];
  const scenarios = (testCases?.scenarios ?? []) as EvalScenario[];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const languageModel = createLanguageModel({
      voice,
      agentConfig: autopilotApplication.intelligence.config,
      knowledgeBase: {
        load: async () => {},
        queryKnowledgeBase: async (query: string) => query
      },
      telephonyContext: scenario.telephonyContext as TelephonyContext
    });

    const testTextSimilarity = createTestTextSimilarity(
      {
        provider: agentConfig.testCases?.evalsLanguageModel?.provider,
        model: agentConfig.testCases?.evalsLanguageModel?.model ?? "",
        apiKey: agentConfig.testCases?.evalsLanguageModel?.apiKey
      },
      agentConfig.testCases?.evalsSystemPrompt || textSimilaryPrompt
    );

    const evaluationReport = await evaluateScenario({
      agentConfig,
      scenario,
      languageModel,
      testTextSimilarity
    });
    evaluationReports.push(evaluationReport);
  }

  return evaluationReports;
}
