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
import { CreateApplicationResponse } from "@fonoster/types";
import { confirm, input, select } from "@inquirer/prompts";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";
import { applicationFlags } from "../../utils/applicationFlags";
import { createOrUpdateApplication } from "../../utils/createOrUpdateApplication";

export default class Create extends AuthenticatedCommand<typeof Create> {
  static override readonly description =
    "add a new Application to the active Workspace";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> --name Bot --url wss://bot.example.com/session",
    "<%= config.bin %> <%= command.id %> --name Bot --url wss://bot.example.com/media --protocol twilio",
    "<%= config.bin %> <%= command.id %> --name Receptionist --agent agent.yaml --voice deepgram/aura-2-thalia-en",
    "<%= config.bin %> <%= command.id %> --from-file app.yaml",
    "<%= config.bin %> <%= command.id %>   # asks for the basics"
  ];
  static override readonly flags = applicationFlags;

  public async run(): Promise<void> {
    const { flags } = await this.parse(Create);
    const interactive = !flags["from-file"] && !flags.name;

    try {
      const answers = interactive ? await this.ask() : {};
      if (!answers) {
        this.log("Aborted!");
        return;
      }

      const client = await this.createSdkClient();
      const response = await createOrUpdateApplication(
        client,
        flags["from-file"],
        undefined,
        false,
        { ...flags, ...answers }
      );
      this.printCreated(response);
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }

  private printCreated(response: CreateApplicationResponse) {
    this.log(`Application created: ${response.ref}`);
    if (response.signingSecret) {
      this.log(
        `Signing secret: ${response.signingSecret}\n` +
          "Save it now: it is shown only once (rotate it with applications:rotate-secret)."
      );
    }
  }

  private async ask() {
    this.log("This utility will help you create an Application.");
    this.log("Press ^C at any time to quit.");

    const name = await input({ message: "Name", required: true });
    const kind = await select({
      message: "Kind",
      choices: [
        { name: "Stream (your WebSocket server)", value: "stream" },
        {
          name: "Autopilot agent (hosted, with an agent file)",
          value: "autopilot"
        }
      ]
    });
    const answers: Record<string, string> = { name };
    if (kind === "autopilot") {
      answers.agent = await input({
        message: "Agent file (YAML or JSON)",
        required: true
      });
    } else {
      answers.url = await input({
        message: "URL (ws:// or wss://)",
        required: true
      });
      answers.protocol = await select({
        message: "Protocol",
        choices: [
          { name: "Fonoster", value: "fonoster" },
          { name: "Twilio-compatible (Media Streams)", value: "twilio" }
        ]
      });
    }
    const voice = await input({
      message: "Voice (catalog id, empty for the default)"
    });
    if (voice) answers.voice = voice;
    const language = await input({ message: "Language", default: "en-US" });
    if (language) answers.language = language;

    return (await confirm({ message: "Ready?" })) ? answers : undefined;
  }
}
