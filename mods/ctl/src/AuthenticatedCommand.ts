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
import { BaseCommand, caHint } from "./BaseCommand";
import { getActiveWorkspace, getConfig } from "./config";
import { CONFIG_FILE } from "./constants";

/**
 * The HTTP API (call records, `/api/records`) sits behind the same host and port as gRPC, over
 * HTTPS (CLI-B3). An endpoint given as a full URL is used as is.
 */
export function httpUrlFor(endpoint: string): string {
  if (/^https?:\/\//.test(endpoint)) return endpoint.replace(/\/+$/, "");
  return `https://${endpoint}`.replace(/\/+$/, "");
}

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
        // The flag wins, then the CA saved at login, then FONOSTER_CA_FILE (read by the SDK).
        caFile: this.flags["ca-file"] ?? activeWorkspace.caFile,
        httpUrl: httpUrlFor(activeWorkspace.endpoint)
      });

      await client.loginWithApiKey(
        activeWorkspace.accessKeyId,
        activeWorkspace.accessKeySecret
      );

      return client;
    } catch (error) {
      const detail = (error as Error)?.message ?? "";
      this.error(
        caHint(
          `Failed to initialize the SDK client. Please try by login to the Workspace again.${detail ? ` (${detail})` : ""}`
        ),
        { exit: 1 }
      );
    }
  }
}
