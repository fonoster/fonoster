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
import { expect } from "chai";
import { evaluateScenario } from "../../src/models/evaluations/evaluateScenario";

describe("evaluateScenario", () => {
  const assistantConfig = {
    conversationSettings: {},
    languageModel: {},
    testCases: undefined,
    eventsHook: undefined
  } as Parameters<typeof evaluateScenario>[0]["assistantConfig"];

  it("calls onStepResult for each step and returns summary", async () => {
    const stepsReceived: Array<{ scenarioRef: string; passed: boolean }> = [];
    const scenario = {
      ref: "scenario-1",
      description: "Test",
      telephonyContext: {
        callDirection: "FROM_PSTN",
        ingressNumber: "+1",
        callerNumber: "+2"
      },
      conversation: [
        {
          userInput: "Hi",
          expected: {
            text: { type: "EXACT" as const, response: "Hello" },
            tools: undefined
          }
        }
      ]
    };
    const languageModel = {
      invoke: async () => ({ type: "say" as const, content: "Hello" })
    };
    const testTextSimilarity = async () => true;

    const report = await evaluateScenario(
      {
        assistantConfig,
        scenario,
        languageModel,
        testTextSimilarity
      },
      (scenarioRef, stepReport) => {
        stepsReceived.push({ scenarioRef, passed: stepReport.passed });
      }
    );

    expect(report.scenarioRef).to.equal("scenario-1");
    expect(report.overallPassed).to.be.true;
    expect(report.steps).to.have.length(1);
    expect(stepsReceived).to.have.length(1);
    expect(stepsReceived[0].scenarioRef).to.equal("scenario-1");
    expect(stepsReceived[0].passed).to.be.true;
  });

  it("sets overallPassed false when a step fails", async () => {
    const scenario = {
      ref: "scenario-2",
      description: "Fail step",
      telephonyContext: {
        callDirection: "FROM_PSTN",
        ingressNumber: "+1",
        callerNumber: "+2"
      },
      conversation: [
        {
          userInput: "Hi",
          expected: {
            text: { type: "EXACT" as const, response: "Hello" },
            tools: undefined
          }
        }
      ]
    };
    const languageModel = {
      invoke: async () => ({ type: "say" as const, content: "Wrong" })
    };
    const testTextSimilarity = async () => false;

    const report = await evaluateScenario({
      assistantConfig,
      scenario,
      languageModel,
      testTextSimilarity
    });

    expect(report.overallPassed).to.be.false;
    expect(report.steps[0].passed).to.be.false;
  });
});
