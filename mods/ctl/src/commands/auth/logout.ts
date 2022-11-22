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
import "../../config";
import { CLIError } from "@oclif/errors";
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { join } from "path";
import { homedir } from "os";

const BASE_DIR = join(homedir(), ".fonoster");
const fs = require("fs");

export default class extends Command {
  static description = "log out from a fonoster deployment";

  async run() {
    CliUx.ux.action.start(`Login out`);
    if (fs.existsSync(BASE_DIR)) {
      try {
        fs.rmSync(BASE_DIR, {recursive: true});
        await CliUx.ux.wait(1000);
      } catch (e) {
        CliUx.ux.action.stop();
        throw new CLIError(e.message);
      }
    }
    CliUx.ux.action.stop("Done");
  }
}
