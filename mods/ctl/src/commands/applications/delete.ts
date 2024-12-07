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
import { Args } from "@oclif/core";
import { BaseCommand } from "../../BaseCommand";
import { getConfig } from "../../config";
import { CONFIG_FILE } from "../../constants";

export default class Delete extends BaseCommand<typeof Delete> {
  static override description = "remove an Application from the system";
  static override examples = ["<%= config.bin %> <%= command.id %>"];
  static override args = {
    ref: Args.string({ description: "the Application to delete" })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Delete);
    const workspaces = getConfig(CONFIG_FILE);
    const currentWorkspace = workspaces.find((w) => w.active);

    if (!currentWorkspace) {
      this.error("No active workspace found.");
    }

    if (!args.ref) {
      this.error("Missing Application reference");
      return;
    }

    const client = new SDK.Client({
      endpoint: currentWorkspace.endpoint,
      accessKeyId: `WO${currentWorkspace.workspaceRef.replaceAll("-", "")}`,
      allowInsecure: flags.insecure
    });

    await client.loginWithApiKey(
      currentWorkspace.accessKeyId,
      currentWorkspace.accessKeySecret
    );

    const applications = new SDK.Applications(client);
    await applications.deleteApplication(args.ref);

    this.log("Done!");
  }
}
