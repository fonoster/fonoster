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
import Command from "../../base/delete";
import { CLIError } from "@oclif/errors";
import { getProjectConfig } from "../../config";
import { ProjectGuard } from "../../decorators/project_guard";

const Apps = require("@fonoster/apps");

export default class DeleteCommand extends Command {
  static description = "delete a Fonoster Application";
  static args = [{ name: "ref" }];
  static aliases = ["apps:del", "apps:rm"];

  @ProjectGuard()
  async run() {
    try {
      await super.deleteResource(new Apps(getProjectConfig()), "deleteApp");
    } catch (e) {
      const message =
        e.code === 9
          ? "unable to delete: please ensure no Resource is using this Fonoster Application"
          : e.message;

      throw new CLIError(message);
    }
  }
}
