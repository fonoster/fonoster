import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {CommonPB} from "@fonoster/numbers";
import {Provider} from "@fonoster/providers/src/client/types";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Providers = require("@fonoster/providers");
const Numbers = require("@fonoster/numbers");
const inquirer = require("inquirer");

export default class CreateCommand extends Command {
  static description = `create a new Fonoster Number
  ...
  Create a new Fonoster Number
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log("This utility will help you create a new Fonoster Number");
    console.log("Press ^C at any time to quit.");

    const view: CommonPB.View = CommonPB.View.BASIC;
    try {
      const response = await new Providers(getProjectConfig()).listProviders({
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
        throw new Error(
          "before adding a Number you must create a Provider (trunk)"
        );
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

      if (!answers.confirm) {
        console.log("Aborted");
      } else {
        cli.action.start(`Creating Number ${answers.e164Number}`);
        const numbers = new Numbers(getProjectConfig());
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
