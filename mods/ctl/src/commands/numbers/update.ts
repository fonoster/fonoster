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
import { getProjectConfig } from "../../config";
import { ProjectGuard } from "../../decorators/project_guard";

const Numbers = require("@fonoster/numbers");
const inquirer = require("inquirer");

export class UpdateCommand extends Command {
  static description = `update a Fonoster Number
  ...
  Update a Fonoster Number
  `;

  static args = [{ name: "ref" }];

  @ProjectGuard()
  async run() {
    console.log(
      "This utility will help you update an existing Fonoster Number"
    );
    console.log("Press ^C at any time to quit.");

    const { args } = this.parse(UpdateCommand);

    if (!args.ref) {
      CliUx.ux.action.stop();
      throw new CLIError("You must provide a Number ref before continuing");
    }

    const numbers = new Numbers(getProjectConfig());

    const answers = await inquirer.prompt([
      {
        name: "aorLink",
        message: "address of record",
        type: "input",
        default: null
      }
    ]);

    if (!answers.aorLink) {
      const webhookPrompt = await inquirer.prompt([
        {
          name: "webhook",
          message: "webhook",
          type: "input",
          default: null
        }
      ]);

      answers.ingressInfo = {};
      answers.ingressInfo.webhook = webhookPrompt.webhook;
    }

    const confirmPrompt = await inquirer.prompt([
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    answers.confirm = confirmPrompt.confirm;
    answers.ref = args.ref;

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        const accessDeny = answers.accessDeny;
        const accessAllow = answers.accessAllow;
        answers.accessDeny = accessDeny ? accessDeny.split(",") : [];
        answers.accessAllow = accessAllow ? accessAllow.split(",") : [];

        CliUx.ux.action.start("Updating number");

        await numbers.updateNumber(answers);
        await CliUx.ux.wait(1000);

        CliUx.ux.action.stop("Done");
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
