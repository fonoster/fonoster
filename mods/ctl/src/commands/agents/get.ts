import "../../config";
import Agents from "@fonos/agents";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {render} from "prettyjson";
import moment from "moment";

export default class GetCommand extends Command {
  static description = `get information about an existing agent`;
  static args = [{name: "ref"}];

  async run() {
    const {args} = this.parse(GetCommand);

    try {
      const agents = new Agents();
      cli.action.start(`Getting agent ${args.ref}`);
      const agent = await agents.getAgent(args.ref);

      const jsonObj = {
        Ref: agent.getRef(),
        Name: agent.getName(),
        Username: agent.getUsername(),
        // Privacy: agent.getPrivacy(),
        Domains: agent.domains.join(","),
        Created: moment(agent.getCreateTime()).fromNow(),
        Updated: moment(agent.getUpdateTime()).fromNow()
      };

      await cli.wait(1000);
      cli.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
