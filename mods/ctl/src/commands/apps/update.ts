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

export default class UpdateCommand extends Command {
  static args = [{ name: "ref" }];
  static description = `update a new Fonoster App
  ...
  Update a new Fonoster App
  `;

  @ProjectGuard()
  async run() {
    try {
      const { args } = this.parse(UpdateCommand);

      if (!args.ref)
        throw new CLIError(
          "Please provide the reference of your Fonoster Application"
        );

      const { secrets: response } = await new Secrets(
        getProjectConfig()
      ).listSecrets({
        pageSize: 25,
        pageToken: "1"
      });

      const secrets = response.map(({ name }) => name) || [];

      const appsManager = new Apps(getProjectConfig());
      const app = await appsManager.getApp(args.ref);

      if (!app) throw new CLIError("App not found");

      const answers = await inquirer.prompt([
        {
          name: "name",
          message: "Application Name",
          type: "input",
          default: app.name,
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
          default: app.speechConfig.voice,
          choices: voices,
          validate: (value: string) =>
            validator(value, "You must select a voice")
        },
        {
          name: "speechConfig.secretName",
          message: "Speech Config Secret",
          type: "list",
          choices: secrets,
          default: app.speechConfig.secretName,
          validate: (value: string) =>
            validator(value, "You must select a Secret")
        },
        {
          name: "intentsEngineConfig.welcomeIntentId",
          message: "Type the welcome intent ID (e.g. WELCOME)",
          type: "input",
          default: app.intentsEngineConfig.welcomeIntentId
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
          default: app.intentsEngineConfig.projectId,
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
          default: app.intentsEngineConfig.secretName,
          validate: (value: string) =>
            validator(value, "You must select a Secret")
        },
        // Disabled until we add support for DialogFlow CX
        /*
        {
          name: "intentsEngineConfig.agent",
          message: "Type a agent",
          type: "input",
          default: app.intentsEngineConfig.agent,
          when: (answers) => answers.engine === "DialogflowES",
          validate: (value: string) =>
            validator(value, "You must enter a agent for your Application.")
        },
        {
          name: "intentsEngineConfig.location",
          message: "Type a location",
          type: "input",
          default: app.intentsEngineConfig.location,
          when: (answers) => answers.engine === "DialogflowES",
          validate: (value: string) =>
            validator(value, "You must enter a location for your Application.")
        },
        */
        {
          name: "showAdvanceOptions",
          message: "Show advance options?",
          type: "confirm",
          default: true
        },
        {
          name: "initialDtmf",
          message: "Initial DTMF (optional)",
          type: "input",
          default: app.initialDtmf,
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
          default: app.enableEvents,
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "activationIntentId",
          message: "Type the activation intent ID (optional)",
          type: "input",
          default: app.activationIntentId,
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "activationTimeout",
          message: "Type the activation timeout (e.g. 15000)",
          type: "input",
          default: app.activationTimeout,
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
          default: app.interactionTimeout,
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
            "Type a transfer message (e.g. Please wait while we transfer you)",
          type: "input",
          default: app.transferConfig.message,
          when: (answers) => answers.showAdvanceOptions
        },
        {
          name: "intentsEngineConfig.emulateTelephonyPlatform",
          message: "Emulate Telephony Platform",
          type: "confirm",
          default: app.intentsEngineConfig.emulateTelephonyPlatform,
          when: (answers) => answers.showAdvanceOptions
        }
      ]);

      const confirmPrompt = await inquirer.prompt([
        {
          name: "confirm",
          message: "Ready to update your App?",
          type: "confirm"
        }
      ]);

      if (!confirmPrompt.confirm) return console.log("Aborted");

      CliUx.ux.action.start(`Updating App ${answers.name}`);

      const apps = new Apps(getProjectConfig());

      delete answers.showAdvanceOptions;
      delete answers.engine;

      answers.ref = args.ref;

      const result = await apps.updateApp(answers);

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop(`App ${result.ref} updated`);
    } catch (e) {
      CliUx.ux.action.stop();
      throw new CLIError(e.code === 9 ? "This App already exist" : e.message);
    }
  }
}
