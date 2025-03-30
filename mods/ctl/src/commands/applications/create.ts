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
import { WELCOME_DEMO_SPECIAL_LOCAL_ADDRESS } from "@fonoster/common";
import * as SDK from "@fonoster/sdk";
import { CreateApplicationRequest } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { Flags } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { createOrUpdateApplication } from "../../utils/createOrUpdateApplication";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "add a new Application to the active Workspace";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    "from-file": Flags.string({
      char: "f",
      description: "create Application from YAML or JSON file"
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const client = await this.createSdkClient();

    if (flags["from-file"]) {
      try {
        await createOrUpdateApplication(client, flags["from-file"] as string);
        this.log("Done!");
        return;
      } catch (e) {
        errorHandler(e, this.error.bind(this));
        return;
      }
    }

    this.log("This utility will help you create an Application.");
    this.log("Press ^C at any time to quit.");

    const answers = {
      name: await input({
        message: "Name",
        required: true
      }),
      type: await select({
        message: "Type",
        choices: [{ name: "External", value: "External" }]
      }),
      endpoint: await input({
        message: "Endpoint",
        default: WELCOME_DEMO_SPECIAL_LOCAL_ADDRESS,
        required: true
      }),
      speechToText: {
        productRef: await select({
          message: "SST Vendor",
          choices: [{ name: "Deepgram", value: "stt.deepgram" }]
        }),
        config: {
          languageCode: await select({
            message: "STT Language",
            choices: [
              { name: "English", value: "en-US" },
              { name: "Spanish", value: "es-ES" }
            ]
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
            default: "nova-3"
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
          ]
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
                  default: "eleven_flash_v2_5"
                })
              : null,
          voice: await input({
            message: "TTS Voice",
            required: true
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
      const applications = new SDK.Applications(client);

      await applications.createApplication(answers as CreateApplicationRequest);

      this.log("Done!");
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
