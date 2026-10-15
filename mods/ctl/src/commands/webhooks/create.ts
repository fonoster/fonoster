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
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { eventFlag } from "../../utils/webhookFlags";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "subscribe an HTTPS endpoint to Workspace events";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> --url https://example.com/hooks -e call.ended -e call_record.sealed"
  ];
  static override readonly flags = {
    url: Flags.string({
      char: "u",
      description: "the endpoint that receives the events (https://)",
      required: true
    }),
    event: eventFlag(true)
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    try {
      const client = await this.createSdkClient();
      const webhooks = new SDK.Webhooks(client);
      const response = await webhooks.createWebhook({
        url: flags.url,
        events: flags.event
      });

      this.log(`Webhook created: ${response.ref}`);
      this.log(`Signing secret: ${response.secret}`);
      this.log("Save it now: it is shown only once.");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
