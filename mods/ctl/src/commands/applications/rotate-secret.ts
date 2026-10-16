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

export default class RotateSecret extends AuthenticatedCommand<
  typeof RotateSecret
> {
  static override readonly description =
    "issue a new signing secret for an Application (the old one stops working)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <ref>"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "the Application whose secret to rotate",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(RotateSecret);

    try {
      const client = await this.createSdkClient();
      const applications = new SDK.Applications(client);
      const response = await applications.rotateSigningSecret(args.ref);

      this.log(`Signing secret: ${response.signingSecret}`);
      this.log("Save it now: it is shown only once.");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
