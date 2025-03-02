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
import { UpdateSecretRequest } from "@fonoster/types";
import { confirm, input, password } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "modify the value or metadata of a Secret";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({ description: "the Secret to update", required: true })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Update);
    const client = await this.createSdkClient();
    const secrets = new SDK.Secrets(client);
    const secretFromDB = await secrets.getSecret(args.ref);

    if (!secretFromDB) {
      this.error("Secret not found.");
    }

    this.log("This utility will help you update a Secret.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      name: await input({
        message: "Name",
        required: true,
        default: secretFromDB.name
      }),
      type: await password({
        message: "Secret"
      }),
      confirm: await confirm({
        message: "Ready?"
      })
    };

    if (!answers.confirm) {
      this.log("Aborted!");
      return;
    }

    try {
      await secrets.updateSecret({
        ref: args.ref,
        ...answers
      } as UpdateSecretRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.log.bind(this));
    }
  }
}
