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
import { resolve } from "path";
import * as SDK from "@fonoster/sdk";
import { confirm, input, password } from "@inquirer/prompts";
import { Flags } from "@oclif/core";
import { BaseCommand, caHint } from "../../BaseCommand";
import { addWorkspace, getConfig, WorkspaceConfig } from "../../config";
import { saveConfig } from "../../config/saveConfig";
import { CONFIG_FILE } from "../../constants";

export default class Login extends BaseCommand<typeof Login> {
  static override description = "link a Workspace to the local environment";
  static override examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --ca-file ./config/tls/ca.pem --endpoint voice.example.com --access-key-id WO... --access-key-secret ..."
  ];
  static override flags = {
    endpoint: Flags.string({
      char: "e",
      description: "the API endpoint (skips the questions with the key flags)"
    }),
    "access-key-id": Flags.string({ description: "a Workspace API key id" }),
    "access-key-secret": Flags.string({
      description: "the API key secret"
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Login);
    if (flags["access-key-id"] && flags["access-key-secret"]) {
      const answers = {
        endpoint: flags.endpoint ?? "api.fonoster.ai",
        accessKeyId: flags["access-key-id"],
        accessKeySecret: flags["access-key-secret"]
      };
      const workspaceFromDB = await this.getWorkspaceFromDB(answers);
      this.saveConfig({
        ...answers,
        caFile: this.caFile(flags["ca-file"]),
        workspaceAccessKeyId: workspaceFromDB.accessKeyId,
        ref: workspaceFromDB.ref,
        name: workspaceFromDB.name
      });
      return;
    }

    this.log("This utility will help you add a Workspace.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      endpoint: await input({
        message: "Endpoint",
        default: "api.fonoster.ai"
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
        caFile: this.caFile(flags["ca-file"]),
        workspaceAccessKeyId: workspaceFromDB.accessKeyId,
        ref: workspaceFromDB.ref,
        name: workspaceFromDB.name
      });
    } catch (e) {
      this.error(e.message);
    }
  }

  private saveConfig(params: {
    caFile?: string;
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
      ...(params.caFile ? { caFile: params.caFile } : {}),
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

    try {
      const client = new SDK.Client({
        endpoint,
        accessKeyId,
        caFile: this.caFile(flags["ca-file"])
      });
      await client.loginWithApiKey(accessKeyId, accessKeySecret);

      const workspaces = new SDK.Workspaces(client);
      const workspaceFromDB = (await workspaces.listWorkspaces()).items[0];

      if (!workspaceFromDB) {
        this.error("Invalid credentials!");
      }

      return workspaceFromDB;
    } catch (e) {
      this.error(caHint(e.message));
    }
  }

  /** The --ca-file flag as an absolute path, so later commands find it from any folder. */
  private caFile(flag?: string): string | undefined {
    return flag ? resolve(flag) : undefined;
  }
}
