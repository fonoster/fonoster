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
import { password } from "@inquirer/prompts";
import { Args, Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Set extends AuthenticatedCommand<typeof Set> {
  static override readonly description =
    "set the Workspace's own key for a speech or LLM vendor (replaces any previous key)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> deepgram            # asks for the key",
    "<%= config.bin %> <%= command.id %> elevenlabs --key $ELEVENLABS_API_KEY"
  ];
  static override readonly args = {
    provider: Args.string({
      description: "the provider id (see providers:catalog --kind provider)",
      required: true
    })
  };
  static override readonly flags = {
    key: Flags.string({
      description: "the vendor key (omit to type it without echo)"
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Set);

    try {
      const key =
        flags.key ?? (await password({ message: `${args.provider} key` }));
      if (!key) {
        this.error("A key is required.");
      }
      const client = await this.createSdkClient();
      const saved = await new SDK.Providers(client).setProviderKey({
        providerId: args.provider,
        key
      });
      this.log(`Key set for ${saved.providerId || args.provider}.`);
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
