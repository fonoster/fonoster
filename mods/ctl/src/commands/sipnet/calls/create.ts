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
import { DialStatus } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { CreateCallRequest } from "@fonoster/types";
import { Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "initiate a call to a phone number or SIP URI";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    from: Flags.string({
      char: "f",
      description: "the number to make the call from",
      required: true
    }),
    to: Flags.string({
      char: "t",
      description: "the number to make the call to",
      required: true
    }),
    "app-ref": Flags.string({
      char: "a",
      description: "the reference to the application to use",
      required: true
    }),
    timeout: Flags.string({
      char: "o",
      description: "the call timeout",
      default: "30",
      required: false
    }),
    "track-call": Flags.boolean({
      char: "c",
      description: "track the call",
      default: false,
      required: false
    }),
    metadata: Flags.string({
      char: "m",
      description:
        'a JSON object with metadata for the voice application (e.g. \'{"name": "John Doe"}\')',
      required: false
    })
  };

  public async run(): Promise<void> {
    try {
      const client = await this.createSdkClient();
      const calls = new SDK.Calls(client);

      const callRequest: CreateCallRequest = {
        from: this.flags["from"],
        to: this.flags["to"],
        appRef: this.flags["app-ref"],
        timeout: parseInt(this.flags.timeout || "30"),
        metadata: JSON.parse(this.flags.metadata || "{}")
      };

      const response = await calls.createCall(callRequest);

      this.log(`Call created: ${response.ref}`);

      if (this.flags["track-call"]) {
        for await (const entry of response.statusStream) {
          this.log(`Call status: ${entry.status}`);
          if (entry.status === DialStatus.ANSWER) {
            break;
          }
        }

        this.log("Call ended.");
        process.exit(0);
        return;
      }

      process.exit(0);
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
