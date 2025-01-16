/* eslint-disable import/no-unresolved */
/*
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
import errorHandler from "../../errorHandler";
import { Command, Flags } from "@oclif/core";
import * as fs from "fs";

export default class FormatForJson extends Command {
  static override readonly description =
    "takes a text document and formats it for JSON output";
  static override readonly examples = ["<%= config.bin %> <%= command.id %>"];
  static override readonly flags = {
    input: Flags.string({
      char: "i",
      description: "The input document",
      required: true
    }),
    output: Flags.string({
      char: "o",
      description: "JSON output file",
      required: false
    })
  };

  public async run(): Promise<void> {
    try {
      const { flags } = await this.parse(FormatForJson);
      const inputPath = flags.input;
      const outputPath = flags.output;

      let document: string;

      if (fs.existsSync(inputPath)) {
        document = fs.readFileSync(inputPath, "utf8");
      } else if (fs.existsSync(process.cwd() + "/" + inputPath)) {
        document = fs.readFileSync(process.cwd() + "/" + inputPath, "utf8");
      } else {
        this.error(`Document not found: ${inputPath}`);
      }

      const singleLineContent = document
        .replace(/\r?\n/g, "\\n")
        .replace(/"/g, "'");

      if (outputPath) {
        const jsonObject = {
          content: singleLineContent.replaceAll("\\n", "\n")
        };

        fs.writeFileSync(
          outputPath,
          JSON.stringify(jsonObject, null, 2),
          "utf8"
        );
      } else {
        this.log(`Single line content: ${singleLineContent}`);
      }
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
