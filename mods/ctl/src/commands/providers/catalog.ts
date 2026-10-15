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

export default class Catalog extends AuthenticatedCommand<typeof Catalog> {
  static override readonly description =
    "list the provider catalog: the providers, models and voices apps can use (catalog ids)";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --kind voice",
    "<%= config.bin %> <%= command.id %> --kind model --type stt"
  ];
  static override readonly flags = {
    kind: Flags.string({
      char: "k",
      description: "only this kind of item",
      options: ["provider", "model", "voice"]
    }),
    type: Flags.string({
      char: "t",
      description: "only this capability",
      options: ["stt", "tts", "llm"]
    })
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(Catalog);

    try {
      const client = await this.createSdkClient();
      const { items } = await new SDK.Providers(client).listCatalog({
        kind: flags.kind as "provider" | "model" | "voice" | undefined,
        type: flags.type as "stt" | "tts" | "llm" | undefined
      });

      const ui = cliui({ width: 200 });
      ui.div(
        { text: "ID", padding: [0, 0, 0, 0], width: 44 },
        { text: "KIND", padding: [0, 0, 0, 0], width: 10 },
        { text: "TYPE", padding: [0, 0, 0, 0], width: 6 },
        { text: "STATE", padding: [0, 0, 0, 0], width: 40 },
        { text: "LANGUAGES", padding: [0, 0, 0, 0] }
      );
      items.forEach((item) => {
        const languages = item.languages ?? [];
        ui.div(
          { text: item.id, padding: [0, 0, 0, 0], width: 44 },
          { text: item.kind, padding: [0, 0, 0, 0], width: 10 },
          {
            text: item.type ?? "-",
            padding: [0, 0, 0, 0],
            width: 6
          },
          {
            text:
              item.state === "deprecated" && item.replacement
                ? `deprecated → ${item.replacement}`
                : item.state,
            padding: [0, 0, 0, 0],
            width: 40
          },
          {
            text:
              languages.slice(0, 6).join(", ") +
              (languages.length > 6 ? ` +${languages.length - 6}` : ""),
            padding: [0, 0, 0, 0]
          }
        );
      });
      this.log(ui.toString());
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
