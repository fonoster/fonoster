/*
 * Copyright (C) 2022 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/plugin-funcs
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
import { Command } from "@oclif/command";
import { CliUx } from "@oclif/core";
import { getProjectConfig } from "../../config";
import { ProjectGuard } from "../../decorators/project_guard";
import { CLIError } from "@oclif/errors";

const Secrets = require("@fonoster/secrets");

export default class DeleteCommand extends Command {
  static description = "remove Fonoster secret";
  static aliases = ["secrets:del", "secrets:rm"];
  static args = [{ name: "name" }];

  @ProjectGuard()
  async run() {
    const { args } = this.parse(DeleteCommand);
    const secretsManager = new Secrets(getProjectConfig());

    if (!args.name) throw new CLIError("You must specify a secret name");

    try {
      CliUx.ux.action.start("Removing the secret...");

      await secretsManager.deleteSecret(args.name);
      await CliUx.ux.wait(1000);
      CliUx.ux.action.stop("Done");
    } catch (e) {
      console.error("Unable to remove!");
    }
  }
}
