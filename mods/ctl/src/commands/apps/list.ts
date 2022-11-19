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
import { CommonPB } from "@fonoster/domains";
import { CLIError } from "@oclif/errors";
import { Command, flags as oclifFlags } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { App } from "@fonoster/apps";
import { getProjectConfig } from "../../config";
import { ProjectGuard } from "../../decorators/project_guard";

const Apps = require("@fonoster/apps");

export default class ListCommand extends Command {
  static description = `list all Fonoster Apps you have access to
  ...
  List all Fonoster Apps you have access to
  `;
  static flags = {
    size: oclifFlags.integer({
      char: "s",
      default: 25,
      description: "number of result per page"
    })
  };
  static aliases = ["apps:ls"];

  @ProjectGuard()
  async run() {
    const { flags } = this.parse(ListCommand);

    try {
      const apps = new Apps(getProjectConfig());
      let firstBatch = true;
      let pageToken = "1";
      const pageSize = flags.size;
      const view: CommonPB.View = CommonPB.View.BASIC;

      // while (true) {
      // Get a list
      const result = await apps.listApps({ pageSize, pageToken, view });

      const list = result.apps;
      pageToken = result.nextPageToken;

      /**
         * @todo Uncomment when pagination is applied in backend.
         * 
         *  if (list.length > 0 && !firstBatch) {
              const answer: any = await inquirer.prompt([
                {name: "q", message: "More", type: "confirm"}
              ]);

              if (!answer.q) break;
            }
         */

      // if (list.length < 1) break;

      const showTable = (showHeader: boolean, data: App[]) => {
        CliUx.ux.table(
          data as any,
          {
            ref: { minWidth: 15 },
            name: { header: "Name", minWidth: 15 },
            projectId: {
              header: "Project ID",
              minWidth: 15,
              get: (row: Record<string, any>) =>
                row.intentsEngineConfig?.projectId || "N/A"
            },
            voice: {
              header: "Voice",
              minWidth: 20,
              get: (row) => row.speechConfig?.voice || "N/A"
            },
            welcomeIntentId: {
              header: "Welcome Intent ID",
              minWidth: 15,
              get: (row) => row.intentsEngineConfig?.welcomeIntentId || "N/A"
            }
          },
          { "no-header": !showHeader }
        );
      };

      showTable(firstBatch, list);

      firstBatch = false;
      // if (!pageToken) break;
      // }
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
