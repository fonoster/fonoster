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
import { toPascalCase } from "../../utils";
const Agents = require("@fonoster/agents");
const moment = require("moment");

export default class GetCommand extends Command {
  static description = "get a Fonoster Agent";
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
