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
const Projects = require("@fonoster/projects");
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
const inquirer = require("inquirer");

export default class extends Command {
  static description = `create a new Fonoster Project
  ...
  Create a new Fonoster Project
  `;

  async run() {
    console.log("This utility will help you create a new Fonoster Project");
    console.log("Press ^C at any time to quit.");

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "allowExperiments",
        message: "enable experimental APIs",
        type: "confirm"
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
        CliUx.ux.action.start(`Creating Project ${answers.name}`);
        const projects = new Projects();
        const project = await projects.createProject(answers);
        await CliUx.ux.wait(1000);
        CliUx.ux.action.stop(project.ref);
      } catch (e) {
        CliUx.ux.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Project already exist");
        } else {
          throw new CLIError(e.message);
        }
      }
    }
  }
}
