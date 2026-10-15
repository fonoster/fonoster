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
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

export default class Resend extends AuthenticatedCommand<typeof Resend> {
  static override readonly description =
    "send a delivery again (same event id, so receivers can dedupe)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <delivery-ref>"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "the delivery to resend (see webhooks:deliveries)",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Resend);

    try {
      const client = await this.createSdkClient();
      const delivery = await new SDK.Webhooks(client).resendWebhookDelivery(
        args.ref
      );
      this.log(
        `Resent ${delivery.eventType} (${delivery.eventId}) as ${delivery.ref}: ${delivery.status}`
      );
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
