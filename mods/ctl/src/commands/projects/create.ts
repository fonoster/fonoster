import "../../config";
const Projects = require("@fonoster/projects");
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
const inquirer = require("inquirer");

export default class extends Command {
  static description = `create a new Fonoster Project
  ...
  Create a new Fonoster Project
  `;

  async run() {
    console.log("This utility will help you create a new Fonoster Project");
    console.log("Press ^C at any time to quit.");

    const answers: any = await inquirer.prompt([
      {
        name: "name",
        message: "friendly name",
        type: "input"
      },
      {
        name: "allowExperiments",
        message: "enable experimental APIs",
        type: "confirm"
      },
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
        CliUx.ux.action.start(`Creating Project ${answers.name}`);
        const projects = new Projects();
        const project = await projects.createProject(answers);
        await CliUx.ux.wait(1000);
        CliUx.ux.action.stop(project.ref);
      } catch (e) {
        CliUx.ux.action.stop();
        if (e.code === 9) {
          throw new CLIError("This Project already exist");
        } else {
          throw new CLIError(e.message);
        }
      }
    }
  }
}
