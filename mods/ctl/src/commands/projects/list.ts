import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
const Projects = require("@fonoster/projects");

export default class ListCommand extends Command {
  static description = `list all Fonoster Projects you have access to
  ...
  List all Fonoster Projects you have access to
  `;
  static aliases = ["projects:ls"];

  async run() {
    try {
      const projects = new Projects();
      // Gets the list
      const result = await projects.listProjects({});
      CliUx.ux.table(result.projects, {
        accessKeyId: {header: "Ref / Access Key Id", minWidth: 30},
        name: {header: "Name", minWidth: 12}
      });
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
