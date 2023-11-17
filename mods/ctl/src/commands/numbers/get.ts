/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import "../../config";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { render } from "prettyjson";
import { getProjectConfig, hasProjectConfig } from "../../config";

const Numbers = require("@fonoster/numbers");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get a Fonoster Number";
  static args = [{ name: "ref" }];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { args } = this.parse(GetCommand);

    try {
      const numbers = new Numbers(getProjectConfig());
      CliUx.ux.action.start(`Getting number ${args.ref}`);
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

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("");
      console.log(render(jsonObj, { noColor: true }));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
