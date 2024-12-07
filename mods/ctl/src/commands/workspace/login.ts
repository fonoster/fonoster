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
import { confirm, input, password } from "@inquirer/prompts";
import { Command } from "@oclif/core";
import { WorkspaceConfig, addWorkspace, getConfig } from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class AuthLogin extends Command {
  static override description = "log in to a Fonoster deployment";
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    this.log("This utility will help you link to a Workspace.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      endpoint: await input({
        message: "Endpoint",
        default: "api.fonoster.dev"
      }),
      accessKeyId: await input({
        message: "Access Key Id",
        required: true
      }),
      accessKeySecret: await password({
        message: "Access Key Secret"
      }),
      confirm: await confirm({
        message: "Ready?"
      })
    };

    if (!answers.confirm) {
      this.log("Aborted!");
      return;
    }

    // Get Workspace configuration (which validates the login)
    const client = new SDK.Client({
      endpoint: answers.endpoint,
      accessKeyId: answers.accessKeyId,
      allowInsecure: true
    });

    try {
      await client.loginWithApiKey(answers.accessKeySecret);

      const workspaces = new SDK.Workspaces(client);
      const workspaceFromDB = (await workspaces.listWorkspaces()).items[0];

      // If the login fails the credentials are invalid
      if (!workspaceFromDB) {
        this.error("Invalid credentials!");
      }

      const workspace: WorkspaceConfig = {
        endpoint: answers.endpoint,
        accessKeyId: answers.accessKeyId,
        accessKeySecret: answers.accessKeySecret,
        workspaceRef: workspaceFromDB.ref,
        workspaceName: workspaceFromDB.name
      };

      this.log("Saving configuration...");

      const config = getConfig(CONFIG_FILE);
      const updatedConfig = addWorkspace(workspace, config);

      saveConfig(CONFIG_FILE, updatedConfig);

      this.log("Done!");
    } catch (e) {
      this.error(e.message);
    }
  }
}
