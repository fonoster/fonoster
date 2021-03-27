import "../../config";
import Agents from "@fonos/agents";
import Domains from "@fonos/domains";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { cli } from "cli-ux";
const inquirer = require("inquirer");

export default class extends Command {
  static description = `creates a new agent resource
  ...
  Creates a new Agent in the SIP Proxy subsystem
  `;

  async run() {
    console.log("This utility will help you create a new Agent");
    console.log("Press ^C at any time to quit.");

    // TODO: Consider using the autocomplete plugin
    const response = await new Domains().listDomains({
      pageSize: 25,
      pageToken: "1"
    });
    const domains = response.domains.map((app: any) => app.domainUri);

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "username",
        message: "username",
        type: "input"
      },
      {
        name: "secret",
        message: "secret",
        type: "password",
        mask: true
      },
      {
        name: "domain",
        message: "domain",
        type: "list",
        choices: domains
      },
      {
        name: "privacy",
        message: "privacy",
        type: "list",
        choices: ["None", "Private"],
        default: "None"
      },
      {
        name: "confirm",
        message: "everything looks good?",
        type: "confirm"
      }
    ]);

    answers.domains = [answers.domain];

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        cli.action.start(`Creating agent ${answers.name}`);
        const agents = new Agents();
        const agent = await agents.createAgent(answers);
        await cli.wait(1000);
        cli.action.stop(agent.getRef());
      } catch (e) {
        cli.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Agent already exist");
        } else {
          throw new CLIError(e);
        }
      }
    }
  }
}
