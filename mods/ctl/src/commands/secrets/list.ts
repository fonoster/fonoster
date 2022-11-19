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
import { Command, flags } from "@oclif/command";
import { CLIError } from "@oclif/errors";
import { ProjectGuard } from "../../decorators/project_guard";
import { getProjectConfig } from "../../config";
import type { Secret } from "@fonoster/secrets/dist/client/types";

// Using import will cause: Error: easy_table_1.default is not a constructor
const Table = require("easy-table");
const Secrets = require("@fonoster/secrets");

export default class ListCommand extends Command {
  static description = "list of the secrets you have access to";
  static aliases = ["secrets:ls"];
  static flags = {
    size: flags.integer({
      char: "s",
      default: 25,
      description: "secrets of result per page"
    })
  };

  @ProjectGuard()
  async run() {
    const { flags } = this.parse(ListCommand);
    const secretsManager = new Secrets(getProjectConfig());

    try {
      const pageSize = flags.size;
      let pageToken = "1";

      const { secrets, nextPageToken } = await secretsManager.listSecrets({
        pageSize,
        pageToken
      });

      pageToken = nextPageToken;

      const table = new Table();

      secrets.forEach((secret: Secret) => {
        table.cell("Name", secret.name);
        table.newRow();
      });

      console.log(
        secrets.length ? table.toString() : "You haven’t created a Secret yet."
      );
    } catch (e) {
      throw new CLIError(e.message);
    }
  }
}
