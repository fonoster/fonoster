import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Providers = require("@fonoster/providers");
const inquirer = require("inquirer");

export default class UpdateCommand extends Command {
  static args = [{name: "ref"}];
  static description = `update a Fonoster Provider
  ...
  Update a Fonoster Provider
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const {args} = this.parse(UpdateCommand);

    if (!args.ref)
      throw new Error("please provide the reference of your Fonoster Provider");

    console.log(
      "This utility will help you update an existing Fonoster Provider"
    );
    console.log("Press ^C at any time to quit.");

    const providers = new Providers(getProjectConfig());
    const provider = await providers.getProvider(args.ref);

    const answers: any = await inquirer.prompt([
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
        message: "sip registration refresh (in seconds)",
        type: "input",
        default: provider.expires
      },
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    answers.ref = args.ref;

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        cli.action.start(`Updating Provider ${answers.name}`);

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
