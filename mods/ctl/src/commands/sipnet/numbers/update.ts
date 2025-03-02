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
import { UpdateNumberRequest } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";
import errorHandler from "../../../errorHandler";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description = "modify the configuration of a Number";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({ description: "the Number to update", required: true })
  };

  public async run(): Promise<void> {
    this.log("This utility will help you update a Number.");
    this.log("Press ^C at any time to quit.");

    const { args } = await this.parse(Update);
    const { ref } = args;
    const client = await this.createSdkClient();
    const trunks = new SDK.Trunks(client);
    const applications = new SDK.Applications(client);
    const numbers = new SDK.Numbers(client);

    const applicationFromDB = await numbers.getNumber(ref);

    if (!applicationFromDB) {
      this.error("Application not found.");
    }

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
      ref,
      name: await input({
        message: "Friendly name",
        required: true,
        default: applicationFromDB.name
      }),
      trunkRef: await select({
        message: "Trunk",
        choices: [{ name: "None", value: null }].concat(trunksList),
        default: applicationFromDB.trunk?.ref
      }),
      appRef: await select({
        message: "Application",
        choices: [{ name: "None", value: null }].concat(applicationsList),
        default: applicationFromDB.appRef
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
      await numbers.updateNumber(answers as unknown as UpdateNumberRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
