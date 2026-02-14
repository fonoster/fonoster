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
import { assistantSchema } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { ExpectedTextType } from "@fonoster/types";
import { Flags } from "@oclif/core";
import * as yaml from "js-yaml";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
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
    "experimental command to test an Autopilot application";

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> -f assistant.json",
    "<%= config.bin %> <%= command.id %> -f assistant.yaml",
    "<%= config.bin %> <%= command.id %> -f assistant.yaml -o json",
    "<%= config.bin %> <%= command.id %> -f assistant.yaml -o json --output-file results.json"
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
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(EvalIntelligence);

    const client = await this.createSdkClient();
    const applications = new SDK.Applications(client);

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
      intelligence: { config: RawConfig; productRef: string };
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

    const parsedAutopilotApplication = assistantSchema.parse(
      rawAutopilotApplication.intelligence.config
    );

    const autopilotApplication = {
      intelligence: {
        productRef: rawAutopilotApplication.intelligence.productRef,
        config: parsedAutopilotApplication
      }
    };

    const stream = applications.evaluateIntelligence(autopilotApplication);
    const outputJson = flags.output === "json";
    const writeOutputFile = Boolean(flags["output-file"]);
    const collectEvents = outputJson || writeOutputFile;
    const events: EvaluateIntelligenceEvent[] = [];

    let currentScenarioRef: string | null = null;
    const stepIndexByScenario = new Map<string, number>();

    for await (const event of stream) {
      if (collectEvents) events.push(event);

      if (outputJson) continue;

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

    if (!collectEvents) return;

    const summary = buildEvalSummary(events);
    const jsonString = JSON.stringify(summary, null, 2);

    if (outputJson) {
      if (writeOutputFile && flags["output-file"]) {
        fs.writeFileSync(flags["output-file"], jsonString, "utf8");
      } else {
        console.log(jsonString);
      }
    } else if (writeOutputFile && flags["output-file"]) {
      fs.writeFileSync(flags["output-file"], jsonString, "utf8");
    }
  }
}
