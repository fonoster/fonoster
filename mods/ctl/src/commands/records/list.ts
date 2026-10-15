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
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { formatDate } from "../../utils/format";

export default class List extends AuthenticatedCommand<typeof List> {
  static override readonly description =
    "search the call records (vCon) of the active Workspace, newest first";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --after 2026-10-01 --number +17853178070",
    "<%= config.bin %> <%= command.id %> --app <app-ref> --status failed"
  ];
  static override readonly flags = {
    after: Flags.string({ description: "started at or after (ISO date/time)" }),
    before: Flags.string({ description: "started before (ISO date/time)" }),
    number: Flags.string({ description: "calls from or to this number" }),
    app: Flags.string({ description: "calls handled by this Application" }),
    status: Flags.string({
      description: "record status (e.g. sealed, failed)"
    }),
    "page-size": Flags.string({
      char: "s",
      description: "the number of items to show",
      default: "50"
    }),
    "page-token": Flags.string({
      char: "t",
      description: "the token for the next page (printed after a full page)"
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(List);

    try {
      const client = await this.createSdkClient();
      const records = new SDK.CallRecords(client);
      const response = await records.listRecords({
        after: flags.after,
        before: flags.before,
        number: flags.number,
        appRef: flags.app,
        status: flags.status,
        pageSize: parseInt(flags["page-size"]),
        pageToken: flags["page-token"]
      });

      const ui = cliui({ width: 200 });
      ui.div(
        { text: "CALL REF", padding: [0, 0, 0, 0], width: 40 },
        { text: "STARTED", padding: [0, 0, 0, 0], width: 22 },
        { text: "FROM", padding: [0, 0, 0, 0], width: 18 },
        { text: "TO", padding: [0, 0, 0, 0], width: 18 },
        { text: "STATUS", padding: [0, 0, 0, 0], width: 10 },
        { text: "SECS", padding: [0, 0, 0, 0], width: 7 },
        { text: "END REASON", padding: [0, 0, 0, 0] }
      );
      response.items.forEach((r) => {
        ui.div(
          { text: r.callRef, padding: [0, 0, 0, 0], width: 40 },
          { text: formatDate(r.startedAt), padding: [0, 0, 0, 0], width: 22 },
          { text: r.from ?? "-", padding: [0, 0, 0, 0], width: 18 },
          { text: r.to ?? "-", padding: [0, 0, 0, 0], width: 18 },
          { text: r.status, padding: [0, 0, 0, 0], width: 10 },
          {
            text: String(Math.round(r.durationSeconds ?? 0)),
            padding: [0, 0, 0, 0],
            width: 7
          },
          {
            text: r.endReason ?? r.failureReason ?? "-",
            padding: [0, 0, 0, 0]
          }
        );
      });
      this.log(ui.toString());
      if (response.nextPageToken) {
        this.log(`Next page: --page-token ${response.nextPageToken}`);
      }
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
