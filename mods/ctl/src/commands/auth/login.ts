import "../../config";
import Agents from "@fonos/agents";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import fs from "promise-fs";
import {join} from "path";
import {homedir} from "os";

const BASE_DIR = join(homedir(), ".fonos");
const PATH_TO_CONFIG = join(BASE_DIR, "config");
const inquirer = require("inquirer");

export default class extends Command {
  static description = `log in to a fonos deployment`;

  async run() {
    console.log("Access your Fonos infrastructure");
    console.log("Press ^C at any time to quit.");

    const answers: any = await inquirer.prompt([
      {
        name: "endpoint",
        message: "api endpoint",
        type: "input",
        default: "api.fonoster.io:50052"
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
          await fs.rmdir(BASE_DIR, {recursive: true});

          const agents = new Agents(answers);
          await agents.listAgents({pageSize: 20, pageToken: "1", view: 0});
          answers.confirm = void 0;
          await fs.mkdir(BASE_DIR, {recursive: true});
          await fs.writeFile(PATH_TO_CONFIG, JSON.stringify(answers));

          await cli.wait(1000);
          cli.action.stop("Done");
        } catch (e) {
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
