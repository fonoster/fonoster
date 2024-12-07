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
import * as SDK from "@fonoster/sdk";
import { Command } from "@oclif/core";
import cliui from "cliui";
import { getConfig } from "../../config";
import { CONFIG_FILE } from "../../constants";

export default class List extends Command {
  static override description = "list all existing Applications";
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    const workspaces = getConfig(CONFIG_FILE);
    const currentWorkspace = workspaces.find((w) => w.active);

    if (!currentWorkspace) {
      this.error("No active workspace found.");
    }

    const client = new SDK.Client({
      endpoint: currentWorkspace.endpoint,
      accessKeyId: currentWorkspace.workspaceRef
    });

    await client.loginWithApiKey(
      currentWorkspace.accessKeyId,
      currentWorkspace.accessKeySecret
    );

    const applications = new SDK.Applications(client);
    const response = await applications.listApplications({
      pageSize: 1000,
      pageToken: ""
    });

    const ui = cliui({ width: 120 });

    ui.div(
      { text: "REF", padding: [0, 0, 0, 0] },
      { text: "NAME", padding: [0, 0, 0, 0] },
      { text: "TYPE", padding: [0, 0, 0, 0] }
    );

    response.items.forEach((workspace) => {
      ui.div(
        { text: workspace.ref, padding: [0, 0, 0, 0] },
        { text: workspace.name, padding: [0, 0, 0, 0] },
        { text: workspace.type, padding: [0, 0, 0, 0] }
      );
    });

    this.log(ui.toString());
  }
}
