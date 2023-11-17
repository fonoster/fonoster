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
import { voices } from "../../data/voices";

const Apps = require("@fonoster/apps");
const Secrets = require("@fonoster/secrets");
const inquirer = require("inquirer");

const validator = (value?: string, message = "This field is required") =>
  Boolean(value?.trim()?.length) || message;

export default class CreateCommand extends Command {
  static description = `create a new Fonoster App
  ...
  Create a new Fonoster App
  `;

  @ProjectGuard()
  async run() {
    console.log("This utility will help you create a new Fonoster App");
    console.log("Press ^C at any time to quit.\n");

    try {
      const { secrets: response } = await new Secrets(
        getProjectConfig()
      ).listSecrets({
        pageSize: 25,
        pageToken: "1"
      });

      const secrets = response.map(({ name }) => name) || [];

      if (secrets.length === 0) {
        throw new CLIError("Before adding a App you must create a Secret");
      }

      const answers = await inquirer.prompt([
        {
          name: "name",
          message: "Application Name",
          type: "input",
          validate: (value: string) =>
            validator(
              value,
              "You must enter a name for your Application, try something friendly."
            )
        },
        {
          name: "speechConfig.voice",
          message: "Voice name",
          type: "list",
          choices: voices,
          validate: (value: string) =>
            validator(value, "You must select a voice")
        },
        {
          name: "speechConfig.secretName",
          message: "Speech Config Secret",
          type: "list",
          choices: secrets,
          validate: (value: string) =>
            validator(value, "You must select a Secret")
        },
        {
          name: "intentsEngineConfig.welcomeIntentId",
          message: "Type the welcome intent ID (e.g. WELCOME)",
          type: "input"
        },
        {
          name: "engine",
          message: "Select Intents Engine Type",
          type: "list",
          choices: ["DialogflowES"],
          validate: (value: string) =>
            validator(value, "You must select a engine")
        },
        {
          name: "intentsEngineConfig.projectId",
          message: "Type a project ID",
          type: "input",
          validate: (value: string) =>
            validator(
              value,
              "You must enter a project ID for your Application."
            )
        },
        {
          name: "intentsEngineConfig.secretName",
          message: "Intents Engine Secret",
          type: "list",
          choices: secrets,
          validate: (value: string) =>
            validator(value, "You must select a Secret")
        },
        // Disabling this until we bring support for Dialogflow CX
        /* {
          name: "intentsEngineConfig.agent",
          message: "Type an Agent",
          type: "input",
          when: (answers) => answers.engine === "DialogflowES",
          validate: (value: string) =>
            validator(value, "You must enter a agent for your Application.")
        },
        {
          name: "intentsEngineConfig.location",
          message: "Type a Location",
          type: "input",
          when: (answers) => answers.engine === "DialogflowES",
          validate: (value: string) =>
            validator(value, "You must enter a location for your Application.")
        },*/
        {
          name: "showAdvanceOptions",
          message: "Show advance options?",
          type: "confirm"
        },
        {
          name: "initialDtmf",
          message: "Initial DTMF (optional)",
          type: "input",
          when: (answers) => answers.showAdvanceOptions,
          validate: (value: string) => {
            const regex = /^[0-9*#]*$/;

            if (value && !regex.test(value)) {
              return "You must enter a valid DTMF. It’s a string that allows 1234567890#*";
            }

            return true;
          }
        },
        {
          name: "enableEvents",
          message: "Enable Events",
          type: "confirm",
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "activationIntentId",
          message: "Type the activation intent ID (optional)",
          type: "input",
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "activationTimeout",
          message: "Type the activation timeout (e.g. 15000)",
          type: "input",
          when: (answers) => answers.showAdvanceOptions,
          validate: (value: string) => {
            const regex = /^[0-9]*$/;

            if (value && !regex.test(value)) {
              return "You must enter a valid timeout. It’s a number in milliseconds";
            }

            return true;
          }
        },
        {
          name: "interactionTimeout",
          message: "Type the interaction timeout (e.g. 10000)",
          type: "input",
          when: (answers) => answers.showAdvanceOptions,
          validate: (value: string) => {
            const regex = /^[0-9]*$/;

            if (value && !regex.test(value)) {
              return "You must enter a valid timeout. It’s a number in milliseconds";
            }

            return true;
          }
        },
        {
          name: "transferConfig.message",
          message:
            "Type a transfer message (e.g. Please wait while we transfer your call.)",
          type: "input",
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "intentsEngineConfig.emulateTelephonyPlatform",
          message: "Emulate Telephony Platform",
          type: "confirm",
          when: (answers) => answers.showAdvanceOptions
        }
      ]);

      const confirmPrompt = await inquirer.prompt([
        {
          name: "confirm",
          message: "Ready to create your App?",
          type: "confirm"
        }
      ]);

      if (!confirmPrompt.confirm) return console.log("Aborted");

      CliUx.ux.action.start(`Creating App ${answers.name}`);

      const apps = new Apps(getProjectConfig());

      delete answers.showAdvanceOptions;
      delete answers.engine;

      const result = await apps.createApp(answers);

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop(result.ref);
    } catch (e) {
      CliUx.ux.action.stop();
      throw new CLIError(e.code === 9 ? "This App already exist" : e.message);
    }
  }
}
