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
import { CreateAclRequest } from "@fonoster/types";
import { confirm, input } from "@inquirer/prompts";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "create a new Access Control List (ACL)";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    this.log(
      "This utility will help you create a new Access Control List (ACL)."
    );
    this.log("Press ^C at any time to quit.");

    const answers = {
      name: await input({
        message: "Name",
        required: true
      }),
      allowString: await input({
        message: "Allow list (Comma separated list of IPs or CIDRs)",
        required: true
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
      const client = await this.createSdkClient();
      const acls = new SDK.Acls(client);

      await acls.createAcl({
        ...answers,
        allow: answers.allowString.split(",").map((a) => a.trim())
      } as unknown as CreateAclRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
