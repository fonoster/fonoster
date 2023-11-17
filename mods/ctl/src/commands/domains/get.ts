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

const Domains = require("@fonoster/domains");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get a Fonoster Domain";
  static args = [{ name: "ref" }];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { args } = this.parse(GetCommand);

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
      console.log(render(jsonObj, { noColor: true }));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
