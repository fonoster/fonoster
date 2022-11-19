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
import { setConfig } from "../../config";

const Projects = require("@fonoster/projects");
const inquirer = require("inquirer");

export default class extends Command {
  static description = "log in to a Fonoster deployment";

  async run() {
    console.log("Access your Fonoster infrastructure");
    console.log("Press ^C at any time to quit.");

    const answers: any = await inquirer.prompt([
      {
        name: "endpoint",
        message: "api endpoint",
        type: "input",
        default: "api.fonoster.io"
      },
      {
        name: "accessKeyId",
        message: "access key id",
        type: "input"
      },
      {
        name: "accessKeySecret",
        message: "access key token",
        mask: true,
        type: "password"
      },
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        CliUx.ux.action.start(`Accessing endpoint ${answers.endpoint}`);

        try {
          const projects = new Projects(answers);
          await projects.listProjects();
          answers.confirm = void 0;
          setConfig(answers);
          await CliUx.ux.wait(1000);
          CliUx.ux.action.stop("Done");
        } catch (e) {
          console.error(e.message);
          await CliUx.ux.wait(1000);
          CliUx.ux.action.stop("Invalid credentials or endpoint");
        }
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
