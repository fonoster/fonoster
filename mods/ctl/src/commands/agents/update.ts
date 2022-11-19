/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import "../../config";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { getProjectConfig, hasProjectConfig } from "../../config";
import { toPascalCase } from "../../utils";
const { Privacy } = require("@fonoster/agents");
const Agents = require("@fonoster/agents");
const inquirer = require("inquirer");

export default class UpdateCommand extends Command {
  static args = [{ name: "ref" }];
  static description = `update a Fonoster Agent
  ...
  Update a Fonoster Agent
  `;
  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log("This utility will help you update an existing Agent");
    console.log("Press ^C at any time to quit.");

    const { args } = this.parse(UpdateCommand);
    const agents = new Agents(getProjectConfig());
    const agent = await agents.getAgent(args.ref);

    const answers = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input",
        default: agent.name
      },
      {
        name: "secret",
        message: "secret",
        type: "password",
        mask: true
      },
      {
        name: "privacy",
        message: "privacy",
        type: "list",
        choices: [toPascalCase(Privacy.NONE), toPascalCase(Privacy.PRIVATE)],
        default: toPascalCase(agent.privacy)
      },
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    answers.ref = args.ref;

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        CliUx.ux.action.start(`Updating agent ${answers.name}`);
        answers.privacy = Privacy[answers.privacy.toUpperCase()];
        await agents.updateAgent(answers);
        await CliUx.ux.wait(1000);

        CliUx.ux.action.stop("Done");
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
