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
import { Flags } from "@oclif/core";
import cliui from "cliui";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

export default class List extends AuthenticatedCommand<typeof List> {
  static override readonly description =
    "display all Webhooks in the active Workspace";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    "page-size": Flags.string({
      char: "s",
      description: "the number of items to show",
      default: "1000",
      required: false
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(List);

    try {
      const client = await this.createSdkClient();
      const webhooks = new SDK.Webhooks(client);
      const response = await webhooks.listWebhooks({
        pageSize: parseInt(flags["page-size"])
      });

      const ui = cliui({ width: 200 });
      ui.div(
        { text: "REF", padding: [0, 0, 0, 0], width: 40 },
        { text: "URL", padding: [0, 0, 0, 0], width: 60 },
        { text: "EVENTS", padding: [0, 0, 0, 0] }
      );
      response.items.forEach((webhook) => {
        ui.div(
          { text: webhook.ref, padding: [0, 0, 0, 0], width: 40 },
          { text: webhook.url, padding: [0, 0, 0, 0], width: 60 },
          { text: webhook.events.join(", "), padding: [0, 0, 0, 0] }
        );
      });
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
