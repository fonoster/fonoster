import "../../config";
import {CLIError} from "@oclif/errors";
import {Command} from "@oclif/command";
import {cli} from "cli-ux";
import {render} from "prettyjson";
import {getProjectConfig, hasProjectConfig} from "../../config";

const Numbers = require("@fonoster/numbers");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = `get a Fonoster Number`;
  static args = [{name: "ref"}];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const {args} = this.parse(GetCommand);

    try {
      const numbers = new Numbers(getProjectConfig());
      cli.action.start(`Getting number ${args.ref}`);
      const number = await numbers.getNumber(args.ref);

      const jsonObj = {
        Ref: number.ref,
        "Provider Ref": number.providerRef,
        "E164 Number": number.e164Number,
        "Address of Record": number.aorLink ? number.aorLink : "--",
        Webhook: number.ingressInfo ? number.ingressInfo.webhook : "--",
        Created: moment(number.createTime).fromNow(),
        Updated: moment(number.updateTime).fromNow()
      };

      await cli.wait(1000);
      cli.action.stop("");
      console.log(render(jsonObj, {noColor: true}));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
