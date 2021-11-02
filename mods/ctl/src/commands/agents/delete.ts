import Command from "../../base/delete";
import {getProjectConfig, hasProjectConfig} from "../../config";
import {CLIError} from "@oclif/errors";
const Agents = require("@fonoster/agents");

export default class extends Command {
  static description = "delete a Fonoster Agent";
  static args = [{name: "ref"}];
  static aliases = ["agents:del", "agents:rm"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    await super.deleteResource(new Agents(getProjectConfig()), "deleteAgent");
  }
}
