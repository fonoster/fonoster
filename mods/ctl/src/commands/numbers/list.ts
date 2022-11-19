/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import "../../config";
import { CLIError } from "@oclif/errors";
import { Command, flags as oclifFlags } from "@oclif/command";
import { CommonPB, Number } from "@fonoster/numbers";
import { CliUx } from "@oclif/core";
import { getProjectConfig, hasProjectConfig } from "../../config";

const Numbers = require("@fonoster/numbers");
const inquirer = require("inquirer");

export default class ListCommand extends Command {
  static description = `list all Fonoster Numbers you have access to
  ...
  List all Fonoster Numbers you have access to
  `;
  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "number of result per page"
    })
  };

  static aliases = ["numbers:ls"];

  async run() {
    if (!hasProjectConfig()) {
      throw new CLIError("you must set a default project");
    }
    const { flags } = this.parse(ListCommand);
    try {
      const numbers = new Numbers(getProjectConfig());
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;
      while (true) {
        // Get a list
        const result: any = await numbers.listNumbers({
          pageSize,
          pageToken,
          view
        });
        const list = result.numbers;
        pageToken = result.nextPageToken;

        // Dont ask this if is the first time or empty data
        if (list.length > 0 && !firstBatch) {
          const answer: any = await inquirer.prompt([
            { name: "q", message: "More", type: "confirm" }
          ]);
          if (!answer.q) break;
        }

        if (list.length < 1) break;

        const showTable = (showHeader: boolean, data: number[]) => {
          CliUx.ux.table(
            data,
            {
              ref: { minWidth: 15 },
              providerRef: { header: "Provider Ref", minWidth: 15 },
              e164Number: { header: "E164 Number", minWidth: 15 },
              aorLink: {
                header: "Address of Record",
                minWidth: 15,
                get: (row) => (row["aorLink"] ? row["aorLink"] : "--")
              },
              ingressInfo: {
                header: "Webhook",
                minWidth: 15,
                get: (row: any) =>
                  row["ingressInfo"] ? row["ingressInfo"].webhook : "--"
              }
            },
            { "no-header": !showHeader }
          );
        };
        showTable(firstBatch, list);

        firstBatch = false;
        if (!pageToken) break;
      }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
