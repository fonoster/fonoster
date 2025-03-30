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
import { UpdateApplicationRequest } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { Args, Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { createOrUpdateApplication } from "../../utils/createOrUpdateApplication";

export default class Update extends AuthenticatedCommand<typeof Update> {
  static override readonly description =
    "modify the configuration of an Application";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly args = {
    ref: Args.string({
      description: "the Application to update",
      required: true
    })
  };

  static override readonly flags = {
    "from-file": Flags.string({
      char: "f",
      description: "update Application from YAML or JSON file"
    })
  };

  public async run(): Promise<void> {
    const { args, flags } = await this.parse(Update);
    const { ref } = args;

    if (flags["from-file"]) {
      try {
        const client = await this.createSdkClient();
        await createOrUpdateApplication(
          client,
          flags["from-file"] as string,
          ref
        );
        this.log("Done!");
        return;
      } catch (e) {
        errorHandler(e, this.error.bind(this));
        return;
      }
    }

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
              { name: "Nova 3", value: "nova-3" },
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
        config: {}
      }
    };

    const answersPartTwo = {
      textToSpeech: {
        config: {
          model:
            answers.textToSpeech.productRef === "tts.elevenlabs"
              ? await select({
                  message: "TTS Model",
                  choices: [
                    {
                      name: "Multilingual v2",
                      value: "eleven_multilingual_v2"
                    },
                    { name: "Flash v2.5", value: "eleven_flash_v2_5" },
                    { name: "Flash v2", value: "eleven_flash_v" },
                    { name: "Turbo v2", value: "eleven_turbo_v2" },
                    { name: "Turbo v2.5", value: "eleven_turbo_v2_5" },
                    {
                      name: "Multilingual Speech to Speech",
                      value: "eleven_multilingual_sts_v2"
                    }
                  ],
                  default: applicationFromDB.textToSpeech?.config
                    ?.model as string
                })
              : null,
          voice: await input({
            message: "TTS Voice",
            required: true,
            default: applicationFromDB.textToSpeech?.config?.voice as string
          })
        }
      },
      confirm: await confirm({
        message: "Ready?"
      })
    };

    if (!answersPartTwo.confirm) {
      this.log("Aborted!");
      return;
    }

    answers.textToSpeech.config = {
      ...answers.textToSpeech.config,
      ...answersPartTwo.textToSpeech.config
    };

    try {
      await applications.updateApplication({
        ref,
        ...answers
      } as UpdateApplicationRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
