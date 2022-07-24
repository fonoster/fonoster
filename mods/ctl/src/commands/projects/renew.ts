import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
const Projects = require("@fonoster/projects");

export default class UpdateCommand extends Command {
  static args = [{name: "ref"}];
  static description = `renew the credentials of a Fonoster Project
  ...
  Renew the credentials of a Fonoster Project
  `;
  async run() {
    const {args} = this.parse(UpdateCommand);

    try {
      const projects = new Projects();
      const project = await projects.renewAccessKeySecret({ref: args.ref});
      CliUx.ux.action.start(`Renewing credentials for ${args.ref}`);
      await CliUx.ux.wait(1000);

      CliUx.ux.action.stop(project.accessKeySecret);
    } catch (e) {
      CliUx.ux.action.stop();
      throw new CLIError(e.message);
    }
  }
}
