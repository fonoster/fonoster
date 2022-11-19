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
const Projects = require("@fonoster/projects");

export default class UpdateCommand extends Command {
  static args = [{ name: "ref" }];
  static description = `renew the credentials of a Fonoster Project
  ...
  Renew the credentials of a Fonoster Project
  `;
  async run() {
    const { args } = this.parse(UpdateCommand);

    try {
      const projects = new Projects();
      const project = await projects.renewAccessKeySecret({ ref: args.ref });
      CliUx.ux.action.start(`Renewing credentials for ${args.ref}`);
      await CliUx.ux.wait(1000);

      CliUx.ux.action.stop(project.accessKeySecret);
    } catch (e) {
      CliUx.ux.action.stop();
      throw new CLIError(e.message);
    }
  }
}
