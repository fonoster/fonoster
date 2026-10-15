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
import { Args, Flags } from "@oclif/core";
import cliui from "cliui";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { formatDate } from "../../utils/webhookFlags";

export default class Deliveries extends AuthenticatedCommand<
  typeof Deliveries
> {
  static override readonly description =
    "show the delivery log (all Webhooks, or one)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> <webhook-ref> -s 20"
  ];
  static override readonly args = {
    ref: Args.string({ description: "only this Webhook's deliveries" })
  };
  static override readonly flags = {
    "page-size": Flags.string({
      char: "s",
      description: "the number of items to show",
      default: "50",
      required: false
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Deliveries);

    try {
      const client = await this.createSdkClient();
      const response = await new SDK.Webhooks(client).listWebhookDeliveries({
        webhookRef: args.ref,
        pageSize: parseInt(flags["page-size"])
      });

      const ui = cliui({ width: 200 });
      ui.div(
        { text: "REF", padding: [0, 2, 0, 0], width: 46 },
        { text: "EVENT", padding: [0, 0, 0, 0], width: 22 },
        { text: "STATUS", padding: [0, 0, 0, 0], width: 11 },
        { text: "ATTEMPTS", padding: [0, 0, 0, 0], width: 10 },
        { text: "HTTP", padding: [0, 0, 0, 0], width: 6 },
        { text: "LAST ATTEMPT", padding: [0, 0, 0, 0], width: 22 },
        { text: "EVENT ID", padding: [0, 0, 0, 0] }
      );
      response.items.forEach((d) => {
        ui.div(
          { text: d.ref, padding: [0, 2, 0, 0], width: 46 },
          { text: d.eventType, padding: [0, 0, 0, 0], width: 22 },
          { text: d.status, padding: [0, 0, 0, 0], width: 11 },
          { text: String(d.attempts), padding: [0, 0, 0, 0], width: 10 },
          {
            text: d.lastStatus ? String(d.lastStatus) : "-",
            padding: [0, 0, 0, 0],
            width: 6
          },
          {
            text: formatDate(d.lastAttemptAt),
            padding: [0, 0, 0, 0],
            width: 22
          },
          { text: d.eventId, padding: [0, 0, 0, 0] }
        );
      });
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
