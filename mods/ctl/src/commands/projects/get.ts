import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
import {render} from "prettyjson";

const Projects = require("@fonoster/projects");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = `get a Fonoster Project`;
  static args = [{name: "ref"}];

  async run() {
    const {args} = this.parse(GetCommand);

    try {
      const projects = new Projects();
      CliUx.ux.action.start(`Getting Project ${args.ref}`);
      const p = await projects.getProject(args.ref);

      const jsonObj = {
        Name: p.name,
        Ref: p.ref,
        "Access Key Id": p.accessKeyId,
        "Access Key Secret": p.accessKeySecret,
        "Allow Experiments": p.allowExperiments,
        Created: moment(p.createTime).fromNow(),
        Updated: moment(p.updateTime).fromNow()
      };

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
