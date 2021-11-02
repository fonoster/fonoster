import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
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
      cli.action.start(`Renewing credentials for ${args.ref}`);
      await cli.wait(1000);

      cli.action.stop(project.accessKeySecret);
    } catch (e) {
      cli.action.stop();
      throw new CLIError(e.message);
    }
  }
}
