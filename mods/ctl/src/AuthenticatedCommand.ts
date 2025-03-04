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
import { Command } from "@oclif/core";
import { BaseCommand } from "./BaseCommand"; // Adjust the import based on your structure
import { getActiveWorkspace, getConfig } from "./config";
import { CONFIG_FILE } from "./constants";

export abstract class AuthenticatedCommand<
  T extends typeof Command
> extends BaseCommand<T> {
  protected async createSdkClient(): Promise<SDK.Client> {
    const workspaces = getConfig(CONFIG_FILE);
    const activeWorkspace = getActiveWorkspace(workspaces);

    if (!activeWorkspace) {
      throw new Error(
        "No active workspace found. Please login to a Workspace."
      );
    }

    try {
      const client = new SDK.Client({
        endpoint: activeWorkspace.endpoint,
        accessKeyId: activeWorkspace.workspaceAccessKeyId,
        allowInsecure: this.flags.insecure
      });

      await client.loginWithApiKey(
        activeWorkspace.accessKeyId,
        activeWorkspace.accessKeySecret
      );

      return client;
    } catch (error) {
      this.error(
        "Failed to initialize the SDK client. Please try by login to the Workspace again.",
        { exit: 1 }
      );
    }
  }
}
