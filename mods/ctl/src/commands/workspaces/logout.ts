/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
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
import { Args, Command } from "@oclif/core";
import { getConfig, removeWorkspace } from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class Logout extends Command {
  static override readonly description =
    "unlink a Workspace from the local environment";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "the Workspace to unlink from",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Logout);
    const { ref } = args;
    const workspaces = getConfig(CONFIG_FILE);
    const updatedWorkspaces = removeWorkspace(ref, workspaces);
    saveConfig(CONFIG_FILE, updatedWorkspaces);
    this.log("Done!");
  }
}
