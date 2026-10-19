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
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { applicationFlags } from "../../utils/applicationFlags";
import { createOrUpdateApplication } from "../../utils/createOrUpdateApplication";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "modify an Application (only the fields you pass change)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <ref> --voice elevenlabs/rachel --patience high",
    "<%= config.bin %> <%= command.id %> <ref> --agent agent.yaml",
    "<%= config.bin %> <%= command.id %> <ref> --clear-listeners --listener wss://rec.example.com/ws,inbound",
    "<%= config.bin %> <%= command.id %> <ref> --noise-cancelling aicoustics",
    "<%= config.bin %> <%= command.id %> --from-file app.yaml   # with `ref` in the file"
  ];
  static override readonly args = {
    ref: Args.string({
      description:
        "the Application to update (optional when `ref` is set in --from-file)"
    })
  };
  static override readonly flags = applicationFlags;

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);

    if (!args.ref && !flags["from-file"]) {
      this.error(
        "An Application ref is required. Pass it as the positional argument or use --from-file with a `ref` field."
      );
    }

    try {
      const client = await this.createSdkClient();
      const response = await createOrUpdateApplication(
        client,
        flags["from-file"],
        args.ref,
        true,
        flags
      );
      this.log(`Application updated: ${response.ref}`);
      if (response.signingSecret) {
        this.log(
          `New signing secret: ${response.signingSecret}\n` +
            "Save it now: it is shown only once."
        );
      }
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
