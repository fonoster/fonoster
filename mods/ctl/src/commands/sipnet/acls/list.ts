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
import { Flags } from "@oclif/core";
import cliui from "cliui";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";

export default class List extends AuthenticatedCommand<typeof List> {
  static override readonly description = "list all Access Control Lists (ACLs)";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    "page-size": Flags.string({
      char: "s",
      description: "the number of items to show",
      default: "1000",
      required: false
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(List);
    const client = await this.createSdkClient();
    const acls = new SDK.Acls(client);
    const response = await acls.listAcls({
      pageSize: parseInt(flags["page-size"])
    });

    const ui = cliui({ width: 100 });

    ui.div(
      { text: "REF", padding: [0, 0, 0, 0], width: 40 },
      { text: "NAME", padding: [0, 0, 0, 0], width: 30 },
      { text: "ALLOW LIST", padding: [0, 0, 0, 0] }
    );

    response.items.forEach((acl) => {
      ui.div(
        { text: acl.ref, padding: [0, 0, 0, 0], width: 40 },
        { text: acl.name, padding: [0, 0, 0, 0], width: 30 },
        { text: acl.allow.join(", "), padding: [0, 0, 0, 0] }
      );
    });

    this.log(ui.toString());
  }
}
