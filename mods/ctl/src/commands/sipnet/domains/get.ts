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
import cliui from "cliui";
import moment from "moment";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of a Domain by reference";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "The Domain reference",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);
    const { ref } = args;
    const client = await this.createSdkClient();
    const domains = new SDK.Domains(client);

    const response = await domains.getDomain(ref);

    const ui = cliui({ width: 200 });

    ui.div(
      "DOMAIN DETAILS\n" +
        "------------------\n" +
        `NAME: \t${response.name}\n` +
        `REF: \t${response.ref}\n` +
        `DOMAIN URI: \t${response.domainUri}\n` +
        `CREATED: \t${moment(response.createdAt).format("YYYY-MM-DD HH:mm:ss")}\n` +
        `UPDATED: \t${moment(response.updatedAt).format("YYYY-MM-DD HH:mm:ss")}\n` +
        (response.accessControlList
          ? `\nACCESS CONTROL LIST:\n` +
            `  NAME: \t${response.accessControlList.name}\n` +
            `  REF: \t${response.accessControlList.ref}\n` +
            `  ALLOW: \t${response.accessControlList.allow.join(", ") || "None"}\n` +
            `  DENY: \t${response.accessControlList.deny.join(", ") || "None"}`
          : `\nACCESS CONTROL LIST: \tNone`) +
        (response.egressPolicies && response.egressPolicies.length > 0
          ? `\n\nEGRESS POLICIES:\n` +
            response.egressPolicies
              .map(
                (policy, index) =>
                  `  ${index + 1}. Rule: ${policy.rule}, Number: ${policy.numberRef}`
              )
              .join("\n")
          : `\n\nEGRESS POLICIES: \tNone`)
    );

    this.log(ui.toString());
  }
}
