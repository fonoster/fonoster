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
import {
  getActiveWorkspace,
  getConfig,
  setActiveWorkspace
} from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class Use extends Command {
  static override readonly description = "set a Workspace as the default";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "The Workspace to unlink from",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Use);
    const { ref } = args;
    const workspaces = getConfig(CONFIG_FILE);
    const updatedWorkspaces = setActiveWorkspace(ref, workspaces);
    const activeWorkspace = getActiveWorkspace(updatedWorkspaces);

    saveConfig(CONFIG_FILE, updatedWorkspaces);

    const { workspaceName, workspaceRef } = activeWorkspace;

    this.log(`Current Workspace: ${workspaceName} (${workspaceRef})`);
  }
}
