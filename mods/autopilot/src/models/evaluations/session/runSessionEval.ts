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
import { testCasesSchema } from "@fonoster/common";
import {
  OPENAI_COMPATIBLE,
  OpenAiCompatibleThink
} from "@fonoster/community/openai";
import { SessionAgent } from "../../../session/config";
import { Think } from "../../../session/think";
import { createTestTextSimilarity } from "../createTestTextSimilarity";
import { textSimilaryPrompt } from "../textSimilaryPrompt";
import { EvalScenario, RunEvalCallbacks } from "../types";
import {
  evaluateSessionScenario,
  SessionEvalOptions,
  SessionScenarioReport
} from "./evaluateSessionScenario";

export type RunSessionEvalOptions = Omit<
  SessionEvalOptions,
  "testTextSimilarity"
> & {
  /** Defaults to the OpenAI similarity judge from the agent's testCases. */
  testTextSimilarity?: SessionEvalOptions["testTextSimilarity"];
  /** The judge's key (the testCases model is always OpenAI). */
  evaluationApiKey?: string;
  /** Meters the judge's tokens (add-usage-metering). */
  judgeUsage?: Parameters<typeof createTestTextSimilarity>[2];
};

/**
 * The session-engine Think for an agent whose catalog provider speaks OpenAI-compatible Chat
 * Completions with a known endpoint (openai, groq, ollama); undefined otherwise.
 */
export function sessionThinkFor(
  agent: SessionAgent,
  apiKey: string | undefined
): Think | undefined {
  const id = agent.languageModel.model;
  const slash = id.indexOf("/");
  const baseUrl = OPENAI_COMPATIBLE[id.slice(0, slash)];
  if (!baseUrl) return undefined;
  return new OpenAiCompatibleThink({ baseUrl, apiKey }, id.slice(slash + 1), {
    temperature: agent.languageModel.temperature,
    maxTokens: agent.languageModel.maxTokens
  });
}

/** Runs every test-case scenario through the session engine, streaming results. */
export async function runSessionEval(
  options: RunSessionEvalOptions,
  callbacks?: Partial<RunEvalCallbacks>
): Promise<SessionScenarioReport[]> {
  const testCases = testCasesSchema.parse(options.agent.testCases);
  const testTextSimilarity =
    options.testTextSimilarity ??
    createTestTextSimilarity(
      {
        provider: testCases.evalsLanguageModel.provider,
        model: testCases.evalsLanguageModel.model,
        apiKey: options.evaluationApiKey ?? testCases.evalsLanguageModel.apiKey
      },
      testCases.evalsSystemPrompt || textSimilaryPrompt,
      options.judgeUsage
    );
  const reports: SessionScenarioReport[] = [];
  for (const scenario of testCases.scenarios as EvalScenario[]) {
    const report = await evaluateSessionScenario(
      { ...options, testTextSimilarity },
      scenario,
      callbacks?.onStepResult
    );
    reports.push(report);
    await callbacks?.onScenarioComplete?.(
      report.scenarioRef,
      report.overallPassed
    );
  }
  return reports;
}
