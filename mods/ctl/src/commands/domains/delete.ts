import Command from "../../base/delete";
import Domains from "@fonos/domains";
import {CLIError} from "@oclif/errors";

export default class DeleteCommand extends Command {
  static description = "remove a domain from a Fonos deployment";
  static args = [{name: "ref"}];
  static aliases = ["domains:del", "domains:rm"];

  async run() {
    try {
      await super.deleteResource(new Domains(), "deleteDomain");
    } catch (e) {
      if (e.code === 9) {
        throw new CLIError(
          "Unable to remove! First ensure there are no Agents under this Domain"
        );
      } else {
        throw new CLIError(e.message);
      }
    }
  }
}
