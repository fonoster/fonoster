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

const Providers = require("@fonoster/providers");
const inquirer = require("inquirer");

export default class UpdateCommand extends Command {
  static args = [{ name: "ref" }];
  static description = `update a Fonoster Provider
  ...
  Update a Fonoster Provider
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { args } = this.parse(UpdateCommand);

    if (!args.ref)
      throw new Error("please provide the reference of your Fonoster Provider");

    console.log(
      "This utility will help you update an existing Fonoster Provider"
    );
    console.log("Press ^C at any time to quit.");

    const providers = new Providers(getProjectConfig());
    const provider = await providers.getProvider(args.ref);

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input",
        default: provider.name
      },
      {
        name: "username",
        message: "username",
        type: "input",
        default: provider.username
      },
      {
        name: "secret",
        message: "secret",
        type: "password",
        mask: true
      },
      {
        name: "host",
        message: "host",
        type: "input",
        default: provider.host
      },
      {
        name: "transport",
        message: "host",
        type: "list",
        choices: ["tcp", "udp"],
        default: provider.transport
      },
      {
        name: "expires",
        message: "sip registration refresh (in seconds)",
        type: "input",
        default: provider.expires
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
        CliUx.ux.action.start(`Updating Provider ${answers.name}`);

        await providers.updateProvider(answers);
        await CliUx.ux.wait(1000);

        CliUx.ux.action.stop("Done");
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
