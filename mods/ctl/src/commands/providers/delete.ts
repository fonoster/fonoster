import Command from "../../base/delete";
import { CLIError } from "@oclif/errors";
import { getProjectConfig, hasProjectConfig } from "../../config";

const Providers = require("@fonoster/providers");

export default class DeleteCommand extends Command {
  static description = "delete a Fonoster Provider";
  static args = [{ name: "ref" }];
  static aliases = ["providers:del", "providers:rm"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    try {
      await super.deleteResource(
        new Providers(getProjectConfig()),
        "deleteProvider"
      );
    } catch (e) {
      if (e.code === 9) {
        throw new CLIError(
          "unable to delete: first ensure there are no Numbers under this Fonoster Provider"
        );
      } else {
        throw new CLIError(e.message);
      }
    }
  }
}
