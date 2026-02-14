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
import { AssistantConfig } from "../../assistants";
import { Voice } from "../../voice";
import { createLanguageModel } from "../createLanguageModel";
import { TelephonyContext } from "../types";
import { createTestTextSimilarity } from "./createTestTextSimilarity";
import { evaluateScenario } from "./evaluateScenario";
import { textSimilaryPrompt } from "./textSimilaryPrompt";
import { EvalScenario, RunEvalCallbacks } from "./types";

export type RunEvalConfig = {
  intelligence: {
    config: AssistantConfig;
  };
};

export async function runEval(
  autopilotApplication: RunEvalConfig,
  callbacks: RunEvalCallbacks
): Promise<void> {
  const { testCases } = autopilotApplication.intelligence.config;
  const assistantConfig = autopilotApplication.intelligence.config;
  const voice = {
    say: async (_: string) => {}
  } as Voice;

  const scenarios = testCases?.scenarios ?? [];

  for (const scenario of scenarios as EvalScenario[]) {
    const languageModel = createLanguageModel({
      voice,
      assistantConfig,
      knowledgeBase: {
        load: async () => {},
        queryKnowledgeBase: async (query: string) => query
      },
      telephonyContext: scenario.telephonyContext as TelephonyContext
    });

    const testTextSimilarity = createTestTextSimilarity(
      {
        provider: assistantConfig.testCases?.evalsLanguageModel?.provider,
        model: assistantConfig.testCases?.evalsLanguageModel?.model ?? "",
        apiKey: assistantConfig.testCases?.evalsLanguageModel?.apiKey
      },
      assistantConfig.testCases?.evalsSystemPrompt ?? textSimilaryPrompt
    );

    const report = await evaluateScenario(
      {
        assistantConfig,
        scenario,
        languageModel,
        testTextSimilarity
      },
      (scenarioRef, stepReport) =>
        callbacks.onStepResult(scenarioRef, stepReport)
    );

    await callbacks.onScenarioComplete(
      report.scenarioRef,
      report.overallPassed
    );
  }
}
