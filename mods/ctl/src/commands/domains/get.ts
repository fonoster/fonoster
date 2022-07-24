import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {CliUx} from "@oclif/core";
import {render} from "prettyjson";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Domains = require("@fonoster/domains");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = `get a Fonoster Domain`;
  static args = [{name: "ref"}];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const {args} = this.parse(GetCommand);

    try {
      const domains = new Domains(getProjectConfig());
      CliUx.ux.action.start(`Getting domain ${args.ref}`);
      const domain = await domains.getDomain(args.ref);
      console.log("geting domain: ");

      const allow =
        domain.accessDeny.length > 0 ? domain.accessDeny.join(",") : "None";

      const deny =
        domain.accessAllow.length > 0 ? domain.accessAllow.join(",") : "None";

      const jsonObj = {
        Name: domain.name,
        "Domain URI": domain.domainUri,
        "Egress Rule": domain.egressRule || "None",
        "Egress Number Ref": domain.egressNumberRef || "None",
        "Access Deny List": deny,
        "Access Allow List": allow,
        Created: moment(domain.createTime).fromNow(),
        Updated: moment(domain.updateTime).fromNow()
      };

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
