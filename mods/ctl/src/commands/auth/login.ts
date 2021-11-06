import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {setConfig} from "../../config";

const Projects = require("@fonoster/projects");
const inquirer = require("inquirer");

export default class extends Command {
  static description = `log in to a Fonoster deployment`;

  async run() {
    console.log("Access your Fonoster infrastructure");
    console.log("Press ^C at any time to quit.");

    const answers: any = await inquirer.prompt([
      {
        name: "endpoint",
        message: "api endpoint",
        type: "input",
        default: "api.fonoster.io"
      },
      {
        name: "accessKeyId",
        message: "access key id",
        type: "input"
      },
      {
        name: "accessKeySecret",
        message: "access key token",
        mask: true,
        type: "password"
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
        cli.action.start(`Accessing endpoint ${answers.endpoint}`);

        try {
          const projects = new Projects(answers);
          await projects.listProjects();
          answers.confirm = void 0;
          setConfig(answers);
          await cli.wait(1000);
          cli.action.stop("Done");
        } catch (e) {
          console.log(e);
          await cli.wait(1000);
          cli.action.stop("Invalid credentials or endpoint");
        }
      } catch (e) {
        cli.action.stop();
        throw new CLIError(e.message);
      }
    }
  }
}
