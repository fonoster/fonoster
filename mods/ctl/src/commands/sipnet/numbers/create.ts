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
import { countryIsoCodes } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { CreateNumberRequest } from "@fonoster/types";
import { confirm, input, search, select } from "@inquirer/prompts";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description = "add a new Number to the SIP network";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];

  public async run(): Promise<void> {
    this.log("This utility will help you add a new Number to the SIP network.");
    this.log("Press ^C at any time to quit.");

    const client = await this.createSdkClient();
    const trunks = new SDK.Trunks(client);
    const applications = new SDK.Applications(client);
    const numbers = new SDK.Numbers(client);

    const trunksList = (await trunks.listTrunks({ pageSize: 1000 })).items.map(
      (item) => ({
        name: item.name,
        value: item.ref
      })
    );

    const applicationsList = (
      await applications.listApplications({ pageSize: 1000 })
    ).items.map((item) => ({
      name: item.name,
      value: item.ref
    }));

    const answers = {
      name: await input({
        message: "Friendly name",
        required: true
      }),
      telUrl: await input({
        message: "Tel URL (E.164 format)",
        required: true
      }),
      trunkRef: await select({
        message: "Trunk",
        choices: [{ name: "None", value: null }].concat(trunksList)
      }),
      appRef: await select({
        message: "Application",
        choices: [{ name: "None", value: null }].concat(applicationsList)
      }),
      city: await input({
        message: "City",
        required: true
      }),
      country: await input({
        message: "Country",
        required: true
      }),
      countryIsoCode: await search({
        message: "Select a country ISO code",
        source: async (input) => {
          if (!input) {
            return countryIsoCodes;
          }

          const filteredCodes = countryIsoCodes.filter(
            ({ name, value }) =>
              name.toLowerCase().includes(input.toLowerCase()) ||
              value.toLowerCase().includes(input.toLowerCase())
          );

          return filteredCodes.map(({ name, value }) => ({
            name: `${name} (${value})`,
            value
          }));
        }
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
      await numbers.createNumber({
        ...answers,
        telUrl: `tel:${answers.telUrl}`
      } as unknown as CreateNumberRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
