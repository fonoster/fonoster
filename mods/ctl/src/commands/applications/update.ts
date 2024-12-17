/* eslint-disable import/no-unresolved */
/*
 * Copyright (C) 2024 by Fonoster Inc (https://fonoster.com)
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
import { UpdateApplicationRequest } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "modify the configuration of an Application";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({ description: "the Application to update" })
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Update);
    const client = await this.createSdkClient();
    const applications = new SDK.Applications(client);
    const applicationFromDB = await applications.getApplication(args.ref);

    if (!applicationFromDB) {
      this.error("Application not found.");
    }

    this.log("This utility will help you update an Application.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      name: await input({
        message: "Name",
        required: true,
        default: applicationFromDB.name
      }),
      type: await select({
        message: "Type",
        choices: [{ name: "External", value: "External" }],
        default: applicationFromDB.type
      }),
      endpoint: await input({
        message: "Endpoint",
        required: true,
        default: applicationFromDB.endpoint
      }),
      speechToText: {
        productRef: await select({
          message: "SST Vendor",
          choices: [{ name: "Deepgram", value: "stt.deepgram" }],
          default: applicationFromDB.speechToText?.productRef
        }),
        config: {
          languageCode: await select({
            message: "STT Language",
            choices: [
              { name: "English", value: "en-US" },
              { name: "Spanish", value: "es-ES" }
            ],
            default: applicationFromDB.speechToText?.config.languageCode
          }),
          model: await select({
            message: "STT Model",
            choices: [
              { name: "Nova 2", value: "nova-2" },
              { name: "Nova 2 Phone Call", value: "nova-2-phonecall" },
              {
                name: "Nova 2 Conversational AI",
                value: "nova-2-conversationalai"
              }
            ],
            default: applicationFromDB.speechToText?.config.model
          })
        }
      },
      textToSpeech: {
        productRef: await select({
          message: "TTS Vendor",
          choices: [
            { name: "Deepgram", value: "tts.deepgram" },
            { name: "ElevenLabs", value: "tts.elevenlabs" },
            { name: "Google", value: "tts.google" },
            { name: "Azure", value: "tts.azure" }
          ],
          default: applicationFromDB.textToSpeech?.productRef
        }),
        config: {
          voice: await input({
            message: "TTS Voice",
            required: true,
            default: applicationFromDB.textToSpeech?.config.voice as string
          })
        }
      },
      confirm: await confirm({
        message: "Ready?"
      })
    };

    if (!answers.confirm) {
      this.log("Aborted!");
      return;
    }

    try {
      await applications.updateApplication({
        ref: args.ref,
        ...answers
      } as UpdateApplicationRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
