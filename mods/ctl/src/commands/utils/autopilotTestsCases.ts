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
import {
  AutopilotApplication,
  evalTestCases,
  printEval
} from "@fonoster/autopilot";
import { assistantSchema } from "@fonoster/common";
import { Flags } from "@oclif/core";
import * as yaml from "js-yaml";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";

export default class AutopilotTestsCases extends AuthenticatedCommand<
  typeof AutopilotTestsCases
> {
  static override readonly description =
    "experimental command to test an Autopilot's behavior";

  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> -f assistant.json",
    "<%= config.bin %> <%= command.id %> -f assistant.yaml"
  ];

  static override readonly flags = {
    file: Flags.string({
      char: "f",
      description: "path to test cases file (json, yaml, or yml)",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(AutopilotTestsCases);

    const fileContent = fs.readFileSync(flags.file, "utf8");
    const extension = path.extname(flags.file).toLowerCase();

    let rawAutopilotApplication: AutopilotApplication;

    switch (extension) {
      case ".yaml":
      case ".yml":
        rawAutopilotApplication = yaml.load(fileContent);
        break;
      case ".json":
        rawAutopilotApplication = JSON.parse(fileContent);
        break;
      default:
        throw new Error(
          "Unsupported file format. Please use .json, .yaml, or .yml files"
        );
    }

    const parsedAutopilotApplication = assistantSchema.parse(
      rawAutopilotApplication.intelligence.config
    );

    // We only need the config from the autopilot application
    const autopilotApplication = {
      intelligence: {
        config: parsedAutopilotApplication
      }
    };

    const result = await evalTestCases(autopilotApplication);
    printEval(result);
  }
}
