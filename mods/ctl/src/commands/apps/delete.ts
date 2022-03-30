import Command from "../../base/delete";
import {CLIError} from "@oclif/errors";
import {getProjectConfig} from "../../config";
import {ProjectGuard} from "../../decorators/project_guard";

const Apps = require("@fonoster/apps");

export default class DeleteCommand extends Command {
  static description = "delete a Fonoster Application";
  static args = [{name: "ref"}];
  static aliases = ["apps:del", "apps:rm"];

  @ProjectGuard()
  async run() {
    try {
      await super.deleteResource(new Apps(getProjectConfig()), "deleteApp");
    } catch (e) {
      const message =
        e.code === 9
          ? "unable to delete: please ensure no Resource is using this Fonoster Application"
          : e.message;

      throw new CLIError(message);
    }
  }
}
