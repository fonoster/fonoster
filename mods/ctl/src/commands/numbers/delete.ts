import Command from "../../base/delete";
import Numbers from "@fonoster/numbers";
import {CLIError} from "@oclif/errors";

export default class DeleteCommand extends Command {
  static description = "remove a number from a Fonoster deployment";
  static args = [{name: "ref"}];
  static aliases = ["numbers:del", "numbers:rm"];

  async run() {
    try {
      await super.deleteResource(new Numbers(), "deleteNumber");
    } catch (e) {
      if (e.code === 9) {
        throw new CLIError(
          "Unable to remove! Please ensure no Domain is using this Number"
        );
      } else {
        throw new CLIError(e.message);
      }
    }
  }
}
