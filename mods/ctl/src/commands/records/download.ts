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
import { writeFileSync } from "fs";
import * as SDK from "@fonoster/sdk";
import { Args, Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

const EXTENSIONS: Record<string, string> = {
  recording: "wav",
  vcon: "vcon.json",
  signed: "vcon.jws.json"
};

export default class Download extends AuthenticatedCommand<typeof Download> {
  static override readonly description =
    "save a call's recording (WAV), vCon (JSON) or signed vCon (JWS) to a file";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> <call-ref>                 # <call-ref>.wav",
    "<%= config.bin %> <%= command.id %> <call-ref> --part vcon -o call.json",
    "<%= config.bin %> <%= command.id %> <call-ref> --part signed   # verifiable JWS"
  ];
  static override readonly args = {
    ref: Args.string({ description: "the call (callRef)", required: true })
  };
  static override readonly flags = {
    part: Flags.string({
      char: "p",
      description: "what to download",
      options: Object.keys(EXTENSIONS),
      default: "recording"
    }),
    output: Flags.string({
      char: "o",
      description: "the file to write (default <call-ref>.<ext>)"
    }),
    version: Flags.integer({
      description: "a record version (default latest)"
    }),
    original: Flags.boolean({
      description: "the unredacted record (owner or admin)",
      default: false
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Download);
    const output = flags.output ?? `${args.ref}.${EXTENSIONS[flags.part]}`;
    const options = { version: flags.version, original: flags.original };

    try {
      const client = await this.createSdkClient();
      const records = new SDK.CallRecords(client);

      if (flags.part === "recording") {
        const recording = await records.getRecording(args.ref, options);
        writeFileSync(output, Buffer.from(recording.data));
        this.log(
          `Saved ${output} (${recording.data.byteLength} bytes, ${recording.contentType}` +
            (recording.contentHash ? `, ${recording.contentHash})` : ")")
        );
        return;
      }

      const record = await records.getRecord(args.ref, options);
      const body = flags.part === "vcon" ? record.vcon : record.jws;
      writeFileSync(output, JSON.stringify(body, null, 2) + "\n");
      this.log(`Saved ${output} (version ${record.version})`);
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
