import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Numbers = require("@fonoster/numbers");
const inquirer = require("inquirer");

export class UpdateCommand extends Command {
  static description = `update a Fonoster Number
  ...
  Update a Fonoster Number
  `;

  static args = [{name: "ref"}];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log(
      "This utility will help you update an existing Fonoster Number"
    );
    console.log("Press ^C at any time to quit.");

    const {args} = this.parse(UpdateCommand);
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
