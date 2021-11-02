import Command from "../../base/delete";
const Projects = require("@fonoster/projects");
import {isDefaultProject, unsetDefaultProject} from "../../config";

export default class extends Command {
  static description = "delete a Fonoster Project";
  static args = [{name: "ref"}];
  static aliases = ["projects:del", "projects:rm"];

  async run() {
    await super.deleteResource(new Projects(), "deleteProject");
    if (isDefaultProject(this.ref)) {
      unsetDefaultProject();
    }
  }
}
