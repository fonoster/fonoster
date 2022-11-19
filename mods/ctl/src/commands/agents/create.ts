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
const Domains = require("@fonoster/domains");
const inquirer = require("inquirer");

export default class extends Command {
  static description = `create a new Fonoster Agent
  ...
  Create a new Fonoster Agent
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log("This utility will help you create a new Agent");
    console.log("Press ^C at any time to quit.");

    // TODO: Consider using the autocomplete plugin
    const response = await new Domains(getProjectConfig()).listDomains({
      pageSize: 25,
      pageToken: "1"
    });

    const domains = response.domains.map((app: any) => app.domainUri);

    if (domains.length === 0) {
      throw new Error("you must create a domain before adding an agent");
    }

    const answers: any = await inquirer.prompt([
      {
        name: "domain",
        message: "domain",
        type: "list",
        choices: domains
      },
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "username",
        message: "username",
        type: "input"
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
        default: "None"
      },
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    answers.domains = [answers.domain];

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        CliUx.ux.action.start(`Creating agent ${answers.name}`);
        const agents = new Agents(getProjectConfig());
        answers.privacy = Privacy[answers.privacy.toUpperCase()];
        const agent = await agents.createAgent(answers);
        await CliUx.ux.wait(1000);
        CliUx.ux.action.stop(agent.ref);
      } catch (e) {
        CliUx.ux.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Agent already exist");
        } else {
          throw new CLIError(e.message);
        }
      }
    }
  }
}
