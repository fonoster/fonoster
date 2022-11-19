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
import { Help } from "@oclif/plugin-help";

const figlet = require("figlet");

export default class MyHelpClass extends Help {
  protected showRootHelp() {
    this.showLogo();

    console.log(this.formatRoot());
    console.log("");

    console.log(this.formatCommands(this.customCommands));
    console.log("");
  }

  private showLogo() {
    console.log("\x1b[32m");
    console.log(
      figlet.textSync("Fonoster", {
        horizontalLayout: "default",
        verticalLayout: "default",
        width: 60,
        whitespaceBreak: true
      })
    );
    console.log("\x1b[0m");
  }

  private get customCommands() {
    return this.sortedCommands
      .filter((c) => c.id)
      .sort((a, b) => (a.id.includes(":") ? 1 : b.id.includes(":") ? -1 : 0));
  }
}
