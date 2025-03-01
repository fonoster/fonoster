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
import { Application } from "@fonoster/types";
import { Args } from "@oclif/core";
import cliui from "cliui";
import moment from "moment";
import { AuthenticatedCommand } from "../../../AuthenticatedCommand";

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of a Number by reference";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "the Number to show details about",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);
    const { ref } = args;
    const client = await this.createSdkClient();
    const numbers = new SDK.Numbers(client);
    const response = await numbers.getNumber(ref);

    const apps = new SDK.Applications(client);
    let app: Application;

    try {
      app = await apps.getApplication(response.appRef);
    } catch (e) {
      // You can only try
    }

    const ui = cliui({ width: 200 });

    ui.div(
      "NUMBER DETAILS\n" +
        "------------------\n" +
        `NAME: \t${response.name}\n` +
        `REF: \t${response.ref}\n` +
        `TEL URL: \t${response.telUrl}\n` +
        `APP: \t${app?.name ?? ""}\n` +
        `APP REF: \t${app?.ref ?? ""}\n` +
        `CITY: \t${response.city}\n` +
        `TRUNK NAME: \t${response.trunk?.name ?? ""}\n` +
        `TRUNK REF: \t${response.trunk?.ref ?? ""}\n` +
        `COUNTRY ISO CODE: \t${response.countryIsoCode}\n` +
        `COUNTRY: \t${response.country}\n` +
        `CREATED: \t${moment(response.createdAt).format("YYYY-MM-DD HH:mm:ss")}\n` +
        `UPDATED: \t${moment(response.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`
    );

    this.log(ui.toString());
  }
}
