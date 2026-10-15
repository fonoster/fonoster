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
import { CallRecordDetail } from "@fonoster/types";
import { Args, Flags } from "@oclif/core";
import cliui from "cliui";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { formatDate } from "../../utils/format";

// The summary lists part names; the detail lists manifest entries ({ name, size, ... }).
function partLabel(part: unknown): string {
  if (typeof part === "string") return part;
  const p = part as { name?: string; size?: number };
  return p.size ? `${p.name} (${p.size} bytes)` : String(p.name);
}

export function formatRecord(r: CallRecordDetail): string {
  const vcon = (r.vcon ?? {}) as {
    analysis?: Array<{ type?: string; body?: unknown }>;
  };
  const transcript = (vcon.analysis ?? []).find((a) => a.type === "transcript");
  const turns = Array.isArray(transcript?.body)
    ? (transcript!.body as unknown[]).length
    : undefined;
  return [
    "CALL RECORD",
    "-----------",
    `CALL REF: \t${r.callRef}`,
    `APP: \t${r.appRef ?? "-"}`,
    `FROM: \t${r.from ?? "-"}`,
    `TO: \t${r.to ?? "-"}`,
    `DIRECTION: \t${r.direction ?? "-"}`,
    `STATUS: \t${r.status}`,
    `END REASON: \t${r.endReason ?? "-"}`,
    ...(r.failureReason ? [`FAILURE: \t${r.failureReason}`] : []),
    ...(r.sipStatus ? [`SIP STATUS: \t${r.sipStatus}`] : []),
    `STARTED: \t${formatDate(r.startedAt)}`,
    `ENDED: \t${formatDate(r.endedAt)}`,
    `DURATION: \t${Math.round(r.durationSeconds ?? 0)}s`,
    `REGION: \t${r.region || "-"}`,
    `VERSION: \t${r.version} of ${r.currentVersion ?? r.version}${r.redacted ? " (redacted)" : ""}`,
    `PARTS: \t${((r.parts ?? []) as unknown[]).map(partLabel).join(", ") || "-"}`,
    ...(turns !== undefined ? [`TRANSCRIPT: \t${turns} entries`] : []),
    `SIZE: \t${r.size ?? 0} bytes`
  ].join("\n");
}

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "show the summary of a call record (use records:download for the files)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <call-ref>",
    "<%= config.bin %> <%= command.id %> <call-ref> --original --version 1"
  ];
  static override readonly args = {
    ref: Args.string({ description: "the call (callRef)", required: true })
  };
  static override readonly flags = {
    version: Flags.integer({
      description: "a record version (default latest)"
    }),
    original: Flags.boolean({
      description: "the unredacted record (owner or admin)",
      default: false
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Get);

    try {
      const client = await this.createSdkClient();
      const record = await new SDK.CallRecords(client).getRecord(args.ref, {
        version: flags.version,
        original: flags.original
      });
      const ui = cliui({ width: 200 });
      ui.div(formatRecord(record));
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
