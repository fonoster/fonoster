import "../../config";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { getConfig, setConfig } from "../../config";

const Projects = require("@fonoster/projects");

export default class UpdateCommand extends Command {
  static args = [{ name: "ref" }];
  static description = `set a default Fonoster Project
  ...
  Set a default Fonoster Project
  `;
  async run() {
    const { args } = this.parse(UpdateCommand);
    try {
      const projects = new Projects();
      const project = await projects.getProject(args.ref);
      CliUx.ux.action.start(`Setting default Project to ${args.ref}`);

      const config = getConfig();
      const { accessKeyId, accessKeySecret, endpoint } = config;
      setConfig({
        endpoint,
        accessKeyId,
        accessKeySecret,
        defaultProject: {
          name: project.name,
          accessKeyId: project.accessKeyId,
          accessKeySecret: project.accessKeySecret
        }
      });

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("Done");
    } catch (e) {
      CliUx.ux.action.stop();
      throw new CLIError(e.message);
    }
  }
}
