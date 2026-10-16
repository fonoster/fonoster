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
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { eventFlag } from "../../utils/webhookFlags";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "change a Webhook's URL or events (--event replaces the list)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <ref> -e call.started -e call.ended",
    "<%= config.bin %> <%= command.id %> <ref> --url https://example.com/new"
  ];
  static override readonly args = {
    ref: Args.string({ description: "the Webhook to update", required: true })
  };
  static override readonly flags = {
    url: Flags.string({ char: "u", description: "the new endpoint" }),
    event: eventFlag(false)
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    if (!flags.url && !flags.event?.length) {
      this.error("Nothing to update: pass --url and/or --event.");
    }

    try {
      const client = await this.createSdkClient();
      const webhooks = new SDK.Webhooks(client);
      await webhooks.updateWebhook({
        ref: args.ref,
        ...(flags.url ? { url: flags.url } : {}),
        ...(flags.event?.length ? { events: flags.event } : {})
      });
      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
