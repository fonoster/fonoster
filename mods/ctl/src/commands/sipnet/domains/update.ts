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
import { UpdateDomainRequest } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description = "modify the configuration of a Domain";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "the Domain reference",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Update);
    const { ref } = args;
    const client = await this.createSdkClient();
    const domains = new SDK.Domains(client);
    const acls = new SDK.Acls(client);
    const domainFromDb = await domains.getDomain(ref);

    if (!domainFromDb) {
      this.error("Domain not found.");
    }

    this.log("This utility will help you update an Domain.");
    this.log("Press ^C at any time to quit.");

    const aclsList = (await acls.listAcls({ pageSize: 1000 })).items.map(
      (item) => ({
        name: item.name,
        value: item.ref
      })
    );

    const answers = {
      ref,
      name: await input({
        message: "Name",
        required: true,
        default: domainFromDb.name
      }),
      accessControlListRef: await select({
        message: "Access Control List",
        choices: [{ name: "None", value: null }].concat(aclsList),
        default: domainFromDb.accessControlList?.ref
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
      // Filter out null ACL reference
      const request: UpdateDomainRequest = {
        ref: answers.ref,
        name: answers.name,
        ...(answers.accessControlListRef && {
          accessControlListRef: answers.accessControlListRef
        })
      };

      await domains.updateDomain(request);
      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
