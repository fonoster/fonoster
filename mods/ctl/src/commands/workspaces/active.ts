/* eslint-disable import/no-unresolved */
/*
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
import { Command } from "@oclif/core";
import { getConfig } from "../../config";
import { CONFIG_FILE } from "../../constants";
import cliui from "cliui";

export default class Active extends Command {
  static override description = "display the name of the active Workspace";
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    const workspaces = getConfig(CONFIG_FILE);
    const activeWorkspace = workspaces.find((w) => w.active === true);

    const { workspaceName, workspaceRef, workspaceAccessKeyId, endpoint } =
      activeWorkspace;

    const ui = cliui({ width: 200 });

    ui.div(
      "ACTIVE WORKSPACE\n" +
        "------------------\n" +
        `NAME: \t${workspaceName}\n` +
        `REF: \t${workspaceRef}\n` +
        `ACCESS KEY ID: \t${workspaceAccessKeyId}\n` +
        `ENDPOINT: \t${endpoint}\n`
    );

    this.log(ui.toString());
  }
}