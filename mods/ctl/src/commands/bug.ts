/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
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
import "../config";
import { CliUx } from "@oclif/core";
import { Command } from "@oclif/command";

export default class extends Command {
  static description = `start a bug report 🐞
  ...
  Opens github issues with a predefine bug template
  `;

  async run() {
    await CliUx.ux.open(
      "https://github.com/fonoster/fonoster/issues/new?assignees=&labels=&template=bug_report.md&title="
    );
  }
}
