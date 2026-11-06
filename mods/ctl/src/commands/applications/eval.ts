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
import * as fs from "fs";
import * as path from "path";
import { sessionAgentSchema } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { ExpectedTextType } from "@fonoster/types";
import { Flags } from "@oclif/core";
import * as yaml from "js-yaml";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import {
  checkBars,
  evalPassed,
  EvalRun,
  EvalScenarioShape,
  printRunsSummary,
  summarizeRuns
} from "../../utils/evalSummary";
import {
  buildEvalSummary,
  printEvalError,
  printScenarioHeader,
  printScenarioSummary,
  printStepResult
} from "../../utils/printEval";
import type { EvaluateIntelligenceEvent } from "@fonoster/types";

export default class EvalIntelligence extends AuthenticatedCommand<
  typeof EvalIntelligence
> {
  static override readonly description =
    "experimental command to test an Autopilot agent";

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> -f agent.json",
    "<%= config.bin %> <%= command.id %> -f agent.yaml",
    "<%= config.bin %> <%= command.id %> -f agent.yaml -o json",
    "<%= config.bin %> <%= command.id %> -f agent.yaml -o json --output-file results.json"
  ];

  static override readonly flags = {
    file: Flags.string({
      char: "f",
      description: "path to test cases file (json, yaml, or yml)",
      required: true
    }),
    output: Flags.string({
      char: "o",
      description: "output format",
      options: ["pretty", "json"],
      default: "pretty"
    }),
    "output-file": Flags.string({
      description:
        "write JSON summary to this file (with pretty: also show streamed output)",
      required: false
    }),
    model: Flags.string({
      description:
        "catalog id of the language model to test, instead of the one in the file"
    }),
    repeat: Flags.integer({
      description:
        "how many times to run the test cases; above 1, prints only the summary",
      default: 1,
      min: 1
    }),
    "max-first-token-p50": Flags.integer({
      description: "fail if the median time to first token is above this, in ms"
    }),
    "max-first-token-p95": Flags.integer({
      description: "fail if the p95 time to first token is above this, in ms"
    }),
    "min-tool-pass": Flags.integer({
      description: "fail if fewer than this percent of tool steps are right",
      min: 0,
      max: 100
    }),
    "min-step-pass": Flags.integer({
      description: "fail if fewer than this percent of steps pass",
      min: 0,
      max: 100
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(EvalIntelligence);

    const fileContent = fs.readFileSync(flags.file, "utf8");
    const extension = path.extname(flags.file).toLowerCase();

    type RawConfig = {
      testCases: {
        scenarios: {
          conversation: { expected?: { text?: { type?: string } } }[];
        }[];
      };
    };

    let rawAutopilotApplication: {
      intelligence: { config: RawConfig; productRef?: string };
    };

    switch (extension) {
      case ".yaml":
      case ".yml":
        rawAutopilotApplication = yaml.load(
          fileContent
        ) as typeof rawAutopilotApplication;
        break;
      case ".json":
        rawAutopilotApplication = JSON.parse(
          fileContent
        ) as typeof rawAutopilotApplication;
        break;
      default:
        throw new Error(
          "Unsupported file format. Please use .json, .yaml, or .yml files"
        );
    }

    // Transform so that all the expected text types are uppercase strings
    const mappedScenarios =
      rawAutopilotApplication.intelligence.config.testCases.scenarios.map(
        (scenario) => {
          scenario.conversation.map((step) => {
            if (step.expected?.text?.type) {
              const type = step.expected.text.type.toLowerCase();
              step.expected.text.type =
                type === "similar" ? ExpectedTextType.SIMILAR : "EXACT";
            }
          });
          return scenario;
        }
      );

    rawAutopilotApplication.intelligence.config.testCases.scenarios =
      mappedScenarios;

    // A session agent (its catalog id names the provider; keys come from the workspace or
    // the platform, never from the file).
    const parsedAutopilotApplication = sessionAgentSchema.parse(
      rawAutopilotApplication.intelligence.config
    );
    if (flags.model)
      parsedAutopilotApplication.languageModel.model = flags.model;
    const autopilotApplication = {
      intelligence: {
        productRef: `llm.${parsedAutopilotApplication.languageModel.model.split("/")[0]}`,
        config: parsedAutopilotApplication
      }
    };

    const outputJson = flags.output === "json";
    const writeOutputFile = Boolean(flags["output-file"]);
    const printSteps = !outputJson && flags.repeat === 1;

    const runs: EvalRun[] = [];
    // eslint-disable-next-line no-loops/no-loops
    for (let i = 0; i < flags.repeat; i++) {
      // A new login each pass: a long --repeat outlives one access token.
      const applications = new SDK.Applications(await this.createSdkClient());
      const events: EvaluateIntelligenceEvent[] = [];
      let currentScenarioRef: string | null = null;
      const stepIndexByScenario = new Map<string, number>();
      try {
        for await (const event of applications.evaluateIntelligence(
          autopilotApplication
        )) {
          events.push(event);
          if (!printSteps) continue;

          if (event.type === "stepResult") {
            if (currentScenarioRef !== event.scenarioRef) {
              currentScenarioRef = event.scenarioRef;
              printScenarioHeader(event.scenarioRef);
              stepIndexByScenario.set(event.scenarioRef, 0);
            }
            const stepIndex = stepIndexByScenario.get(event.scenarioRef) ?? 0;
            printStepResult(event.scenarioRef, stepIndex, event.stepResult);
            stepIndexByScenario.set(event.scenarioRef, stepIndex + 1);
          } else if (event.type === "scenarioSummary") {
            printScenarioSummary(event.scenarioRef, event.overallPassed);
          } else if (event.type === "evalError") {
            printEvalError(event.message);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        events.push({ type: "evalError", message });
        if (printSteps) printEvalError(message);
      }
      runs.push(buildEvalSummary(events));
    }

    const model = parsedAutopilotApplication.languageModel.model;
    const summary = summarizeRuns(
      runs,
      (parsedAutopilotApplication.testCases?.scenarios ??
        []) as EvalScenarioShape[]
    );
    const bars = checkBars(summary, {
      maxFirstTokenP50: flags["max-first-token-p50"],
      maxFirstTokenP95: flags["max-first-token-p95"],
      minToolPass: flags["min-tool-pass"],
      minStepPass: flags["min-step-pass"]
    });
    const passed = evalPassed(runs, summary, bars);

    if (!outputJson && (flags.repeat > 1 || bars.length))
      printRunsSummary(model, summary, bars);

    if (outputJson || writeOutputFile) {
      const result = {
        // One run keeps the shape this output has always had.
        ...(flags.repeat === 1 ? runs[0] : { runs }),
        model,
        summary,
        bars,
        passed
      };
      const jsonString = JSON.stringify(result, null, 2);
      if (writeOutputFile && flags["output-file"]) {
        fs.writeFileSync(flags["output-file"], jsonString, "utf8");
      } else {
        console.log(jsonString);
      }
    }

    if (!passed) this.exit(1);
  }
}
