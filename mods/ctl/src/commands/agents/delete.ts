import Command from "../../base/delete";
import Agents from "@fonos/agents";

export default class extends Command {
  static description = "remove agent from a Fonos deployment";
  static args = [{name: "ref"}];
  static aliases = ["agents:del", "agents:rm"];

  async run() {
    await super.deleteResource(new Agents(), "deleteAgent");
  }
}
