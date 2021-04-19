import "../../config";
import Domains from "@fonos/domains";
import Numbers from "@fonos/numbers";
import {CommonPB} from "@fonos/domains";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";

const inquirer = require("inquirer");
const view: CommonPB.View = CommonPB.View.BASIC;

export default class CreateCommand extends Command {
  static description = `creates a new domain resource
  ...
  Creates a new Domain in the SIP Proxy subsystem
  `;

  async run() {
    console.log("This utility will help you create a new Domain");
    console.log("Press ^C at any time to quit.");

    const numbers = new Numbers()
    const result = await numbers.listNumbers({ pageSize: 20, pageToken: '1', view})
    const nums = result.numbers.map((n:any) => {
      return {
        value: n.ref,
        name: n.e164Number
      }
    })
    nums.unshift({
      value: "none",
      name: "none"
    });

    const answers = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "domainUri",
        message: "domain uri (e.g acme.com)",
        type: "input"
      },
      {
        name: "egressNumberRef",
        message: "egress number",
        type: "list",
        choices: nums,
        default: "none"
      },
      {
        name: "egressRule",
        message: "egress rule",
        type: "input",
        default: ".*"
      },
      /*{
        name: 'accessDeny',
        message: 'access deny list',
        type: 'input',
        default: '0.0.0.0/1'
      },
      {
        name: 'accessAllow',
        message: 'access allow list',
        type: 'input'
      },*/
      {
        name: "confirm",
        message: "everything looks good?",
        type: "confirm"
      }
    ]);

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        const accessDeny = answers.accessDeny;
        const accessAllow = answers.accessAllow;
        answers.accessDeny = accessDeny ? accessDeny.split(",") : [];
        answers.accessAllow = accessAllow ? accessAllow.split(",") : [];
        if (!answers.egressNumberRef || answers.egressNumberRef === "none") {
          delete answers.egressRule;
          delete answers.egressNumberRef;
        }

        cli.action.start(`Creating domain ${answers.name}`);

        const domains = new Domains();
        const domain = await domains.createDomain(answers);
        await cli.wait(1000);

        cli.action.stop(domain.ref);
      } catch (e) {
        cli.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Domain already exist");
        } else {
          throw new CLIError(e);
        }
      }
    }
  }
}
