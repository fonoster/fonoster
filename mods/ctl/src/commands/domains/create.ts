import "../../config";
import {CommonPB} from "@fonoster/domains";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Numbers = require("@fonoster/numbers");
const Domains = require("@fonoster/domains");
const inquirer = require("inquirer");
const view: CommonPB.View = CommonPB.View.BASIC;

export default class CreateCommand extends Command {
  static description = `create a new Fonoster Domain
  ...
  Create a new Fonoster Domain
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log("This utility will help you create a new Fonoster Domain");
    console.log("Press ^C at any time to quit.");

    const numbers = new Numbers(getProjectConfig());
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

    const answers = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "domainUri",
        message: "domain uri (e.g acme)",
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
        message: "ready?",
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

        cli.action.start(`Creating Domain ${answers.name}`);

        const domains = new Domains(getProjectConfig());
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
