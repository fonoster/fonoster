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
import { Command } from "@oclif/core";
import cliui from "cliui";
import { getConfig } from "../../config";
import { CONFIG_FILE } from "../../constants";

export default class List extends Command {
  static override description = "display all linked Workspaces";
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    const workspaces = getConfig(CONFIG_FILE);
    const ui = cliui({ width: 120 });

    ui.div(
      { text: "REF", padding: [0, 0, 0, 0] },
      { text: "NAME", padding: [0, 0, 0, 0] },
      { text: "STATUS", padding: [0, 0, 0, 0] }
    );

    workspaces.forEach((workspace) => {
      ui.div(
        { text: workspace.workspaceRef, padding: [0, 0, 0, 0] },
        { text: workspace.workspaceName, padding: [0, 0, 0, 0] },
        { text: workspace.active ? "[ACTIVE]" : "", padding: [0, 0, 0, 0] }
      );
    });

    this.log(ui.toString());
  }
}
