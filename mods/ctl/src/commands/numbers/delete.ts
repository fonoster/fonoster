import Command from "../../base/delete";
import { CLIError } from "@oclif/errors";
import { getProjectConfig, hasProjectConfig } from "../../config";

const Numbers = require("@fonoster/numbers");

export default class DeleteCommand extends Command {
  static description = "delete a Fonoster Number";
  static args = [{ name: "ref" }];
  static aliases = ["numbers:del", "numbers:rm"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    try {
      await super.deleteResource(
        new Numbers(getProjectConfig()),
        "deleteNumber"
      );
    } catch (e) {
      if (e.code === 9) {
        throw new CLIError(
          "unable to delete: please ensure no Domain is using this Fonoster Number"
        );
      } else {
        throw new CLIError(e.message);
      }
    }
  }
}
