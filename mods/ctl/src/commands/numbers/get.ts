import "../../config";
import Numbers from "@fonos/numbers";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {render} from "prettyjson";
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get information about an existing number";
  static args = [{name: "ref"}];

  async run() {
    const {args} = this.parse(GetCommand);

    try {
      const numbers = new Numbers();
      cli.action.start(`Getting number ${args.ref}`);
      const number = await numbers.getNumber(args.ref);

      const jsonObj = {
        Ref: number.getRef(),
        "Provider Ref": number.getProviderRef(),
        "E164 Number": number.getE164Number(),
        "AOR Link": number.getAorLink() || "--",
        "Ingress App": number.getIngressApp() || "--",
        Created: moment(number.getCreateTime()).fromNow(),
        Updated: moment(number.getUpdateTime()).fromNow()
      };

      await cli.wait(1000);
      cli.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
