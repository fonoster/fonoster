/* eslint-disable import/no-unresolved */
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
import { Flags } from "@oclif/core";
import * as fs from "fs";
import * as yaml from "js-yaml";
import { AssistantConfig, evalTestCases, printEval } from "@fonoster/autopilot";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import * as path from "path";

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

    let assistantConfig: AssistantConfig;

    switch (extension) {
      case ".yaml":
      case ".yml":
        assistantConfig = yaml.load(fileContent);
        break;
      case ".json":
        assistantConfig = JSON.parse(fileContent);
        break;
      default:
        throw new Error(
          "Unsupported file format. Please use .json, .yaml, or .yml files"
        );
    }

    const result = await evalTestCases(assistantConfig);
    printEval(result);
  }
}
