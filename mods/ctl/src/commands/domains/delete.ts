import Command from "../../base/delete";
import { CLIError } from "@oclif/errors";
import { getProjectConfig, hasProjectConfig } from "../../config";

const Domains = require("@fonoster/domains");

export default class DeleteCommand extends Command {
  static description = "delete a Fonoster Domain";
  static args = [{ name: "ref" }];
  static aliases = ["domains:del", "domains:rm"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    try {
      await super.deleteResource(
        new Domains(getProjectConfig()),
        "deleteDomain"
      );
    } catch (e) {
      if (e.code === 9) {
        throw new CLIError(
          "unable to delete: first ensure there are no Agents under this Fonoster Domain"
        );
      } else {
        throw new CLIError(e.message);
      }
    }
  }
}
