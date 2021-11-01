import "../../config";
import Providers from "@fonoster/providers";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {render} from "prettyjson";
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get information about an existing provider";
  static args = [{name: "ref"}];

  async run() {
    const {args} = this.parse(GetCommand);

    try {
      const providers = new Providers();
      cli.action.start(`getting provider ${args.ref}`);
      const provider = await providers.getProvider(args.ref);

      const jsonObj = {
        Ref: provider.ref,
        Name: provider.name,
        Username: provider.username || "(static)",
        Host: provider.host,
        Transport: provider.transport,
        Expires: provider.expires,
        Created: moment(provider.createTime).fromNow(),
        Updated: moment(provider.updateTime).fromNow()
      };

      await cli.wait(1000);
      cli.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
