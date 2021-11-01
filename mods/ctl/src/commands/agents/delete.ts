import Command from "../../base/delete";
import Agents from "@fonoster/agents";

export default class extends Command {
  static description = "removes agent from a Fonoster deployment";
  static args = [{name: "ref"}];
  static aliases = ["agents:del", "agents:rm"];

  async run() {
    await super.deleteResource(new Agents(), "deleteAgent");
  }
}
