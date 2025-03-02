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
import { UpdateAclRequest } from "@fonoster/types";
import { confirm, input } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "update an existing Access Control List (ACL)";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "the ACL reference",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Update);
    const { ref } = args;
    const client = await this.createSdkClient();
    const acls = new SDK.Acls(client);
    const aclFromDB = await acls.getAcl(ref);

    if (!aclFromDB) {
      this.error("ACL not found.");
    }

    this.log(
      "This utility will help you update an existing Access Control List (ACL)."
    );
    this.log("Press ^C at any time to quit.");

    const answers = {
      ref,
      name: await input({
        message: "Name",
        required: true,
        default: aclFromDB.name
      }),
      allowString: await input({
        message: "Allow list (Comma separated list of IPs or CIDRs)",
        required: true,
        default: aclFromDB.allow.join(", ")
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
      await acls.updateAcl({
        ...answers,
        allow: answers.allowString.split(",").map((a) => a.trim())
      } as unknown as UpdateAclRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
