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

export default class ListCommand extends Command {
  static description = `list all Fonoster Projects you have access to
  ...
  List all Fonoster Projects you have access to
  `;
  static aliases = ["projects:ls"];

  async run() {
    try {
      const projects = new Projects();
      // Gets the list
      const result = await projects.listProjects({});
      CliUx.ux.table(result.projects, {
        accessKeyId: { header: "Ref / Access Key Id", minWidth: 30 },
        name: { header: "Name", minWidth: 12 }
      });
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
