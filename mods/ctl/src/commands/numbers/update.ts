import "../../config";
import Numbers from "@fonos/numbers";
import Apps from "@fonos/appmanager";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {CommonPB, AppManagerPB} from "@fonos/numbers";
import {App} from "@fonos/appmanager/src/types";

const inquirer = require("inquirer");

export class UpdateCommand extends Command {
  static description = `updates a number at the SIP Proxy subsystem
  ...
  Updates a number at the SIP Proxy subsystem
  `;

  static args = [{name: "ref"}];

  async run() {
    console.log("This utility will help you update an existing Number");
    console.log("Press ^C at any time to quit.");

    // TODO: Consider using the autocomplete plugin
    const view: CommonPB.View = CommonPB.View.BASIC;
    const response = await new Apps().listApps({
      pageSize: 25,
      pageToken: "1",
      view
    });
    const apps = response.apps.map((app: App) => {
      return {
        name: app.name,
        value: app.ref
      };
    });

    const {args} = this.parse(UpdateCommand);
    const numbers = new Numbers();

    const answers = await inquirer.prompt([
      {
        name: "aorLink",
        message: "aor link",
        type: "input",
        default: null
      }
    ]);

    if (!answers.aorLink) {
      const ingressAppPrompt = await inquirer.prompt([
        {
          name: "ingressApp",
          message: "ingress app",
          type: "list",
          choices: apps
        }
      ]);

      answers.ingressApp = ingressAppPrompt.ingressApp;
    }

    const confirmPrompt = await inquirer.prompt([
      {
        name: "confirm",
        message: "are you sure you want to update?",
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

        cli.action.start(`Updating number`);

        await numbers.updateNumber(answers);
        await cli.wait(1000);

        cli.action.stop("Done");
      } catch (e) {
        cli.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
