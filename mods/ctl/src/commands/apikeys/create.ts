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
import { Role } from "@fonoster/types";
import { Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "create an API key for the active Workspace";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    expiration: Flags.string({
      char: "e",
      description:
        "API Key expiration time in days(e.g. 10d) or months(e.g. 10m)",
      required: false
    }),
    role: Flags.string({
      char: "r",
      description: "API Key role",
      default: Role.WORKSPACE_ADMIN,
      required: false
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    const sdkClient = await this.createSdkClient();
    const apiKeys = new SDK.ApiKeys(sdkClient);
    const result = await apiKeys.createApiKey({
      role: flags.role as Role
    });

    this.log("Access Key regenerated successfully!");
    this.log(`Access Key ID: ${result.accessKeyId}`);
    this.log(`Access Key Secret: ${result.accessKeySecret}`);
    this.log("");
    this.warn(
      "This is the only time the Access Key Secret will be shown.\nPlease copy it and store it securely!"
    );
  }
}
