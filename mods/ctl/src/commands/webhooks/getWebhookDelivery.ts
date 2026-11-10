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
import { Args } from "@oclif/core";
import cliui from "cliui";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { formatDate } from "../../utils/webhookFlags";

export default class GetWebhookDelivery extends AuthenticatedCommand<
  typeof GetWebhookDelivery
> {
  static override readonly description =
    "show a delivery and the event it sent, as JSON";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <delivery-ref>"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "the delivery to show (see webhooks:deliveries)",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(GetWebhookDelivery);

    try {
      const client = await this.createSdkClient();
      const delivery = await new SDK.Webhooks(client).getWebhookDelivery(
        args.ref
      );

      const ui = cliui({ width: 200 });
      ui.div(
        "DELIVERY DETAILS\n" +
          "----------------\n" +
          `REF: \t${delivery.ref}\n` +
          `WEBHOOK: \t${delivery.webhookRef}\n` +
          `EVENT: \t${delivery.eventType}\n` +
          `EVENT ID: \t${delivery.eventId}\n` +
          `STATUS: \t${delivery.status}\n` +
          `ATTEMPTS: \t${delivery.attempts}\n` +
          `HTTP: \t${delivery.lastStatus || "-"}\n` +
          `LAST ATTEMPT: \t${formatDate(delivery.lastAttemptAt)}\n` +
          `CREATED: \t${formatDate(delivery.createdAt)}`
      );
      this.log(ui.toString());
      this.log("");
      this.log("BODY");
      this.log(
        "The event as Fonoster stored it. Key order can differ from the bytes your server received, so don't use it to check a signature."
      );
      this.log(JSON.stringify(delivery.event, null, 2));
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
