import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {getProjectConfig, hasProjectConfig} from "../../config";
const Agents = require("@fonoster/agents");
const Domains = require("@fonoster/domains");
const inquirer = require("inquirer");

export default class extends Command {
  static description = `create a new Fonoster Agent
  ...
  Create a new Fonoster Agent
  `;

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    console.log("This utility will help you create a new Agent");
    console.log("Press ^C at any time to quit.");

    // TODO: Consider using the autocomplete plugin
    const response = await new Domains(getProjectConfig()).listDomains({
      pageSize: 25,
      pageToken: "1"
    });

    const domains = response.domains.map((app: any) => app.domainUri);

    if (domains.length === 0) {
      throw new Error("you must create a domain before adding an agent");
    }

    const answers: any = await inquirer.prompt([
      {
        name: "domain",
        message: "domain",
        type: "list",
        choices: domains
      },
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
        name: "privacy",
        message: "privacy",
        type: "list",
        choices: ["None", "Private"],
        default: "None"
      },
      {
        name: "confirm",
        message: "ready?",
        type: "confirm"
      }
    ]);

    answers.domains = [answers.domain];

    if (!answers.confirm) {
      console.log("Aborted");
    } else {
      try {
        cli.action.start(`Creating agent ${answers.name}`);
        const agents = new Agents(getProjectConfig());
        const agent = await agents.createAgent(answers);
        await cli.wait(1000);
        cli.action.stop(agent.ref);
      } catch (e) {
        cli.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Agent already exist");
        } else {
          throw new CLIError(e.message);
        }
      }
    }
  }
}
