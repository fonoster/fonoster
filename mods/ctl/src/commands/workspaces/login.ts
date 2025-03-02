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
import * as SDK from "@fonoster/sdk";
import { confirm, input, password } from "@inquirer/prompts";
import { BaseCommand } from "../../BaseCommand";
import { addWorkspace, getConfig, WorkspaceConfig } from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class Login extends BaseCommand<typeof Login> {
  static override description = "link a Workspace to the local environment";
  static override examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    this.log("This utility will help you add a Workspace.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      endpoint: await input({
        message: "Endpoint",
        default: "api.fonoster.com"
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

    try {
      const workspaceFromDB = await this.getWorkspaceFromDB(answers);

      this.saveConfig({
        ...answers,
        workspaceAccessKeyId: workspaceFromDB.accessKeyId,
        ref: workspaceFromDB.ref,
        name: workspaceFromDB.name
      });
    } catch (e) {
      this.error(e.message);
    }
  }

  private saveConfig(params: {
    endpoint: string;
    workspaceAccessKeyId: string;
    accessKeyId: string;
    accessKeySecret: string;
    ref: string;
    name: string;
  }) {
    const {
      endpoint,
      workspaceAccessKeyId,
      accessKeyId,
      accessKeySecret,
      ref: workspaceRef,
      name: workspaceName
    } = params;

    const workspace: WorkspaceConfig = {
      workspaceAccessKeyId,
      endpoint,
      accessKeyId,
      accessKeySecret,
      workspaceRef,
      workspaceName
    };

    const config = getConfig(CONFIG_FILE);
    const updatedConfig = addWorkspace(workspace, config);
    saveConfig(CONFIG_FILE, updatedConfig);

    this.log("Done!");
  }

  private async getWorkspaceFromDB(params: {
    endpoint: string;
    accessKeyId: string;
    accessKeySecret: string;
  }) {
    const { flags } = await this.parse(Login);
    const { endpoint, accessKeyId, accessKeySecret } = params;
    const client = new SDK.Client({
      endpoint,
      accessKeyId,
      allowInsecure: flags.insecure
    });

    try {
      await client.loginWithApiKey(accessKeyId, accessKeySecret);

      const workspaces = new SDK.Workspaces(client);
      const workspaceFromDB = (await workspaces.listWorkspaces()).items[0];

      if (!workspaceFromDB) {
        this.error("Invalid credentials!");
      }

      return workspaceFromDB;
    } catch (e) {
      this.error(e.message);
    }
  }
}
