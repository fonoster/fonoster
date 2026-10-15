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
import cliui from "cliui";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";
import { formatDate } from "../../../utils/format";

export default class List extends AuthenticatedCommand<typeof List> {
  static override readonly description =
    "list the vendors the Workspace has its own key for (keys are never shown)";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    await this.parse(List);

    try {
      const client = await this.createSdkClient();
      const { items } = await new SDK.Providers(client).listProviderKeys();

      const ui = cliui({ width: 120 });
      ui.div(
        { text: "PROVIDER", padding: [0, 0, 0, 0], width: 20 },
        { text: "REF", padding: [0, 0, 0, 0], width: 40 },
        { text: "UPDATED", padding: [0, 0, 0, 0] }
      );
      items.forEach((item) => {
        ui.div(
          { text: item.providerId, padding: [0, 0, 0, 0], width: 20 },
          { text: item.ref, padding: [0, 0, 0, 0], width: 40 },
          {
            text: formatDate(item.updatedAt ?? item.createdAt),
            padding: [0, 0, 0, 0]
          }
        );
      });
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
