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

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of a Webhook by reference";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <ref>"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "the Webhook to show details about",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);

    try {
      const client = await this.createSdkClient();
      const webhooks = new SDK.Webhooks(client);
      const webhook = await webhooks.getWebhook(args.ref);

      const ui = cliui({ width: 200 });
      ui.div(
        "WEBHOOK DETAILS\n" +
          "---------------\n" +
          `REF: \t${webhook.ref}\n` +
          `URL: \t${webhook.url}\n` +
          `EVENTS: \t${webhook.events.join(", ")}\n` +
          `SECRET: \t${webhook.secretHint || "-"}\n` +
          (webhook.previousSecretUntil
            ? `PREVIOUS SECRET VALID UNTIL: \t${formatDate(webhook.previousSecretUntil)}\n`
            : "") +
          `CREATED: \t${formatDate(webhook.createdAt)}\n` +
          `UPDATED: \t${formatDate(webhook.updatedAt)}`
      );
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
