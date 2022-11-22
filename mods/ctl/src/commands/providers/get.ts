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

const Providers = require("@fonoster/providers");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get a Fonoster Provider";
  static args = [{ name: "ref" }];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { args } = this.parse(GetCommand);

    try {
      const providers = new Providers(getProjectConfig());
      CliUx.ux.action.start(`getting provider ${args.ref}`);
      const provider = await providers.getProvider(args.ref);

      const jsonObj = {
        Ref: provider.ref,
        Name: provider.name,
        Username: provider.username || "(static)",
        Host: provider.host,
        Transport: provider.transport,
        "SIP Registration Refresh": provider.expires,
        Created: moment(provider.createTime).fromNow(),
        Updated: moment(provider.updateTime).fromNow()
      };

      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("");
      console.log(render(jsonObj, { noColor: true }));
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
