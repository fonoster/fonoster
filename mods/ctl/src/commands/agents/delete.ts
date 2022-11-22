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
import { getProjectConfig, hasProjectConfig } from "../../config";
import { CLIError } from "@oclif/errors";
const Agents = require("@fonoster/agents");

export default class extends Command {
  static description = "delete a Fonoster Agent";
  static args = [{ name: "ref" }];
  static aliases = ["agents:del", "agents:rm"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    await super.deleteResource(new Agents(getProjectConfig()), "deleteAgent");
  }
}
