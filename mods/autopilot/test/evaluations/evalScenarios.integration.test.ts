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

/**
 * Integration test for assistant evaluation scenarios (paid vendor calls; run on demand).
 *
 * EVAL_ASSISTANT_FILE names a session assistant (JSON or YAML) with testCases; the model key comes
 * from EVAL_API_KEY and the evaluation model's (OpenAI) key from OPENAI_API_KEY. Skips without
 * them.
 */
import * as fs from "fs";
import { expect } from "chai";
import * as yaml from "js-yaml";
import { sessionAssistantSchema } from "@fonoster/common";
import { ScenarioEvaluationReport } from "@fonoster/types";
import { createEvalEffectiveConfig } from "../../src/models/evaluations/createEvalEffectiveConfig";
import { evalTestCases } from "../../src/models/evaluations/evalTestCases";

function formatFailureMessage(report: ScenarioEvaluationReport): string {
  const details = report.steps?.map((s) => ({
    passed: s.passed,
    errorMessage: s.errorMessage,
    toolEvaluations: s.toolEvaluations
  }));
  return `Scenario "${report.scenarioRef}" failed. Steps: ${JSON.stringify(details, null, 2)}`;
}

describe("Autopilot Evaluation Scenarios", function () {
  this.timeout(240_000);

  let reports: ScenarioEvaluationReport[];

  before(async function () {
    const file = process.env.EVAL_ASSISTANT_FILE;
    if (!file || !fs.existsSync(file) || !process.env.OPENAI_API_KEY) {
      console.log(
        "[eval] skipping: set EVAL_ASSISTANT_FILE and OPENAI_API_KEY"
      );
      this.skip();
      return;
    }
    const assistant = sessionAssistantSchema.parse(
      yaml.load(fs.readFileSync(file, "utf8"))
    );
    reports = await evalTestCases({
      intelligence: {
        config: createEvalEffectiveConfig(
          {
            ...assistant,
            languageModel: { ...assistant.languageModel, temperature: 0 }
          },
          {
            apiKey: process.env.EVAL_API_KEY ?? process.env.OPENAI_API_KEY,
            evaluationApiKey: process.env.OPENAI_API_KEY
          }
        )
      }
    });
  });

  it("should pass every scenario", function () {
    expect(reports).to.be.an("array").that.is.not.empty;
    for (const report of reports) {
      expect(report.overallPassed, formatFailureMessage(report)).to.be.true;
    }
  });
});
