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
import { CreateAgentRequest } from "@fonoster/types";
import { confirm, input, number, select } from "@inquirer/prompts";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description = "add a new SIP Agent to the network";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    this.log("This utility will help you add a new SIP Agent to the network.");
    this.log("Press ^C at any time to quit.");

    const client = await this.createSdkClient();
    const agents = new SDK.Agents(client);
    const domains = new SDK.Domains(client);
    const credentials = new SDK.Credentials(client);

    const domainsList = (
      await domains.listDomains({ pageSize: 1000 })
    ).items.map((d) => ({ name: d.name, value: d.ref }));

    const credentialsList = (
      await credentials.listCredentials({ pageSize: 1000 })
    ).items.map((c) => ({ name: c.name, value: c.ref }));

    const answers = {
      name: await input({
        message: "Name",
        required: true
      }),
      username: await input({
        message: "Username",
        required: true
      }),
      domainRef: await select({
        message: "Domain",
        choices: [{ name: "None", value: null }].concat(domainsList)
      }),
      credentialsRef: await select({
        message: "Credentials",
        choices: [{ name: "None", value: null }].concat(credentialsList)
      }),
      privacy: await select({
        message: "Privacy",
        choices: [
          { name: "Private", value: "PRIVATE" },
          { name: "None", value: "NONE" }
        ]
      }),
      enabled: await confirm({
        message: "Enabled?"
      }),
      maxContacts: await number({
        message: "Max Contacts"
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
      await agents.createAgent(answers as unknown as CreateAgentRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
