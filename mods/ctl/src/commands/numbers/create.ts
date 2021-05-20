import "../../config";
import Providers from "@fonos/providers";
import Numbers from "@fonos/numbers";
import Apps from "@fonos/appmanager";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {CommonPB, AppManagerPB} from "@fonos/numbers";
import {App} from "@fonos/appmanager/src/types";
import {Provider} from "@fonos/providers/src/types";
const phone = require("phone");
const inquirer = require("inquirer");

export default class CreateCommand extends Command {
  static description = `creates a new number resource
  ...
  Creates a new Number in the SIP Proxy subsystem
  `;

  async run() {
    console.log("This utility will help you create a new Number");
    console.log("Press ^C at any time to quit.");

    const view: CommonPB.View = CommonPB.View.BASIC;
    try {
      // TODO: Consider using the autocomplete plugin
      const res = await new Apps().listApps({
        pageSize: 25,
        pageToken: "1",
        view
      });
      const apps = res.apps.map((app: App) => {
        return {
          name: app.name,
          value: app.ref
        };
      });

      const response = await new Providers().listProviders({
        pageSize: 25,
        pageToken: "1"
      });

      interface objProvider {
        name?: string;
        value?: string;
      }

      const providers = response.providers.map((p: Provider) => {
        const obj: objProvider = {};
        obj.name = p.name;
        obj.value = p.ref;
        return obj;
      });

      if (providers.length === 0) {
        throw new Error("you must create a provider before adding a number");
      }

      const answers: any = await inquirer.prompt([
        {
          name: "e164Number",
          message: "number in E.164 format (e.g. +16471234567)",
          type: "input"
        },
        {
          name: "providerRef",
          message: "service provider",
          type: "list",
          choices: providers
        },
        {
          name: "aorLink",
          message: "aor link",
          type: "input",
          default: null
        }
      ]);

      if (!answers.aorLink) {
        if (apps.length === 0) {
          throw new Error("Not application or aorLink found");
        }

        const ingresAppPrompt = await inquirer.prompt([
          {
            name: "ingressApp",
            message: "ingress app",
            type: "list",
            choices: apps
          }
        ]);

        answers.ingressApp = ingresAppPrompt.ingressApp;
      }

      const confirmPrompt = await inquirer.prompt([
        {
          name: "confirm",
          message: "ready?",
          type: "confirm"
        }
      ]);

      answers.confirm = confirmPrompt.confirm;

      if (!answers.confirm) {
        console.log("Aborted");
      } else {
        const number = phone(answers.e164Number)[0];
        if (!number)
          throw new Error(
            `number ${answers.e164Number} is not a valid E.164 number`
          );
        cli.action.start(`Creating number ${number}`);
        answers.e164Number = number;
        const numbers = new Numbers();
        const result = await numbers.createNumber(answers);
        await cli.wait(1000);
        cli.action.stop(result.ref);
      }
    } catch (e) {
      cli.action.stop();
      if (e.code === 9) {
        throw new CLIError("This Number already exist");
      } else {
        throw new CLIError(e);
      }
    }
  }
}
