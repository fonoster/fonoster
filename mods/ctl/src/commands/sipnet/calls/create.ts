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
import { CreateCallRequest } from "@fonoster/types";
import { Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";
import { trackCallStatus } from "../../../utils/trackCallStatus";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "place an outbound call to a phone number or SIP URI and follow its status";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> -f +17853178070 -t +18287854037 -a <app-ref>",
    "<%= config.bin %> <%= command.id %> -f +17853178070 -t +18287854037 -a <app-ref> --detach",
    `<%= config.bin %> <%= command.id %> -f +17853178070 -t +18287854037 -a <app-ref> -m '{"name":"Jane"}'`
  ];
  static override readonly flags = {
    from: Flags.string({
      char: "f",
      description: "the number to make the call from",
      required: true
    }),
    to: Flags.string({
      char: "t",
      description: "the number or SIP URI to call",
      required: true
    }),
    "app-ref": Flags.string({
      char: "a",
      description: "the Application that handles the call",
      required: true
    }),
    timeout: Flags.integer({
      char: "o",
      description: "seconds to wait for an answer",
      default: 30
    }),
    metadata: Flags.string({
      char: "m",
      description:
        'a JSON object the app receives with the session (e.g. \'{"name": "John Doe"}\')'
    }),
    detach: Flags.boolean({
      char: "d",
      description: "print the call ref and return without following the status",
      default: false
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);

    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(flags.metadata || "{}");
    } catch {
      this.error("--metadata must be a JSON object");
    }

    try {
      const client = await this.createSdkClient();
      const calls = new SDK.Calls(client);

      const callRequest: CreateCallRequest = {
        from: flags.from,
        to: flags.to,
        appRef: flags["app-ref"],
        timeout: flags.timeout,
        metadata
      };

      const response = await calls.createCall(callRequest);
      this.log(`Call created: ${response.ref}`);

      if (!flags.detach) {
        const last = await trackCallStatus(
          response.statusStream,
          this.log.bind(this)
        );
        if (last === "ANSWER") {
          this.log(
            "Answered. Its call record appears in records:list after hangup."
          );
        }
      }
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
