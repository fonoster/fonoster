import "../../config";
import Domains from "@fonoster/domains";
import {CommonPB} from "@fonoster/domains";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import Numbers from "@fonoster/numbers";
const inquirer = require("inquirer");
const view: CommonPB.View = CommonPB.View.BASIC;

export default class UpdateCommand extends Command {
  static args = [{name: "ref"}];
  static description = `updates a domain at the SIP Proxy subsystem
  ...
  Updates a domain at the SIP Proxy subsystem
  `;

  async run() {
    console.log("This utility will help you create a basic voice application");
    console.log("to help you get start quickly. Press ^C at any time to quit.");

    const {args} = this.parse(UpdateCommand);
    const domains = new Domains();
    const domain = await domains.getDomain(args.ref);
    const numbers = new Numbers();

    const result = await numbers.listNumbers({
      pageSize: 20,
      pageToken: "1",
      view
    });
    const nums = result.numbers.map((n: any) => {
      return {
        value: n.ref,
        name: n.e164Number
      };
    });
    nums.unshift({
      value: "none",
      name: "none"
    });

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "domain name",
        type: "input",
        default: domain.name
      },
      {
        name: "egressRule",
        message: "egress rule",
        type: "input",
        default: domain.egressRule
      },
      {
        name: "egressNumberRef",
        message: "egress number",
        type: "list",
        choices: nums,
        default: "none"
      },
      /*
      {
        name: "accessDeny",
        message: "access deny list",
        type: "input",
        default: domain.accessDeny.join(",")
      },
      {
        name: "accessAllow",
        message: "access allow list",
        type: "input",
        default: domain.accessAllow.join(",")
      },
      */
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
        const accessDeny = answers.accessDeny;
        const accessAllow = answers.accessAllow;
        answers.accessDeny = accessDeny ? accessDeny.split(",") : [];
        answers.accessAllow = accessAllow ? accessAllow.split(",") : [];

        cli.action.start(`Updating domain ${answers.name}`);

        await domains.updateDomain(answers);
        await cli.wait(1000);

        cli.action.stop("Done");
      } catch (e) {
        cli.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
