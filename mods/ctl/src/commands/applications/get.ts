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
import { Args } from "@oclif/core";
import cliui from "cliui";
import moment from "moment";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";

export default class Get extends AuthenticatedCommand<typeof Get> {
  static override readonly description =
    "retrieve details of an Application by reference";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "The Application to show details about",
      required: true
    })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Get);
    const client = await this.createSdkClient();
    const applications = new SDK.Applications(client);

    const response = await applications.getApplication(args.ref);

    const ui = cliui({ width: 200 });

    // STT or none of productRef is undefined
    const stt = response.speechToText?.productRef
      ? response.speechToText?.productRef.replace("stt.", "")
      : "none";
    const tts = response.textToSpeech?.productRef
      ? response.textToSpeech?.productRef.replace("tts.", "")
      : "none";

    ui.div(
      "APPLICATION DETAILS\n" +
        "------------------\n" +
        `NAME: \t${response.name}\n` +
        `REF: \t${response.ref}\n` +
        `STT: \t${stt}\n` +
        `TTS: \t${tts}\n` +
        `TYPE: \t${response.type}\n` +
        `ENDPOINT: \t${response.endpoint}\n` +
        `CREATED: \t${moment(response.createdAt).format("YYYY-MM-DD HH:mm:ss")}\n` +
        `UPDATED: \t${moment(response.updatedAt).format("YYYY-MM-DD HH:mm:ss")}`
    );

    this.log(ui.toString());
  }
}
