import "../../config";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { render } from "prettyjson";
import { getProjectConfig, hasProjectConfig } from "../../config";
import { toPascalCase } from "../../utils";
const Agents = require("@fonoster/agents");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = `get a Fonoster Agent`;
  static args = [{ name: "ref" }];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { args } = this.parse(GetCommand);

    try {
      const agents = new Agents(getProjectConfig());
      CliUx.ux.action.start(`Getting Agent ${args.ref}`);
      const agent = await agents.getAgent(args.ref);

      const jsonObj = {
        Ref: agent.ref,
        Name: agent.name,
        Username: agent.username,
        Privacy: toPascalCase(agent.privacy),
        Domains: agent.domains.join(","),
        Created: moment(agent.createTime).fromNow(),
        Updated: moment(agent.updateTime).fromNow()
      };

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("");
      console.log(render(jsonObj, { noColor: true }));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
