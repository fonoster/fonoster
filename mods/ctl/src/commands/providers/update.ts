import "../../config";
import Providers from "@fonos/providers";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
const inquirer = require("inquirer");

export default class UpdateCommand extends Command {
  static args = [{name: "ref"}];
  static description = `updates a provider at the SIP Proxy subsystem
  ...
  Updates a provider at the SIP Proxy subsystem
  `;

  async run() {
    const {args} = this.parse(UpdateCommand);

    if (!args.ref) throw new Error("Please provide reference number");

    console.log("This utility will help you update an existing Provider");
    console.log("Press ^C at any time to quit.");

    const providers = new Providers();
    const provider = await providers.getProvider(args.ref);

    const answers = await inquirer.prompt([
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
        message: "expire",
        type: "input",
        default: provider.expires
      },
      {
        name: "confirm",
        message: "everything looks good?",
        type: "confirm"
      }
    ]);

    answers.ref = args.ref;

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        cli.action.start(`Updating provider ${answers.name}`);

        await providers.updateProvider(answers);
        await cli.wait(1000);

        cli.action.stop("Done");
      } catch (e) {
        cli.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
