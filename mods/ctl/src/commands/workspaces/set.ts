/* eslint-disable import/no-unresolved */
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { getConfig, setCurrentWorkspace } from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class Set extends Command {
  static override description = "make a Workspace the default";
  static override examples = ["<%= config.bin %> <%= command.id %>"];
  static override args = {
    ref: Args.string({ description: "The Workspace to unlink from" })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Set);

    if (!args.ref) {
      this.error("Missing Workspace reference");
      return;
    }

    const workspaces = getConfig(CONFIG_FILE);
    const updatedWorkspaces = setCurrentWorkspace(args.ref, workspaces);
    const currentWorkspace = updatedWorkspaces.find(
      (w) => w.workspaceRef === args.ref
    );

    saveConfig(CONFIG_FILE, updatedWorkspaces);

    const { workspaceName, workspaceRef } = currentWorkspace;

    this.log(`Current Workspace: ${workspaceName} (${workspaceRef})`);
  }
}
