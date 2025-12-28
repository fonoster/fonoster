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
import * as fs from "fs";
import os from "os";
import * as path from "path";
import { Command, Flags } from "@oclif/core";
import { getConfig } from "../../config";
import { CONFIG_FILE } from "../../constants";

export default class Configure extends Command {
  static override description = "configure MCP client settings";

  static override examples = [
    "<%= config.bin %> <%= command.id %> --client claude",
    "<%= config.bin %> <%= command.id %> --client claude --workspace my-workspace"
  ];

  static override flags = {
    client: Flags.string({
      char: "c",
      description: "MCP client to configure",
      default: "claude",
      options: ["claude"]
    }),
    workspace: Flags.string({
      char: "w",
      description: "workspace reference",
      required: false
    })
  };

  private getMcpConfigPath(): string {
    if (process.platform === "darwin") {
      return path.join(
        os.homedir(),
        "Library/Application Support/Claude/claude_desktop_config.json"
      );
    } else if (process.platform === "win32") {
      return path.join(
        os.homedir(),
        "AppData/Roaming/Claude/claude_desktop_config.json"
      );
    }
    throw new Error("Unsupported platform");
  }

  public async run(): Promise<void> {
    const { flags } = await this.parse(Configure);

    const workspaces = getConfig(CONFIG_FILE);
    const workspace = flags.workspace
      ? workspaces.find((w) => w.workspaceRef === flags.workspace)
      : workspaces.find((w) => w.active === true);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    const mcpConfigPath = this.getMcpConfigPath();
    let mcpConfig: any = { mcpServers: {} };

    try {
      if (fs.existsSync(mcpConfigPath)) {
        mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf8"));
      }
    } catch (err) {
      this.warn("Could not read existing MCP config, creating new one");
    }

    mcpConfig.mcpServers.fonoster = {
      command: "npx",
      args: ["-y", "@fonoster/mcp@latest"],
      env: {
        MCP_WORKSPACE_ACCESS_KEY_ID: workspace.workspaceAccessKeyId,
        MCP_APIKEY_ACCESS_KEY_ID: workspace.accessKeyId,
        MCP_APIKEY_ACCESS_KEY_SECRET: workspace.accessKeySecret
      }
    };

    fs.mkdirSync(path.dirname(mcpConfigPath), { recursive: true });
    fs.writeFileSync(mcpConfigPath, JSON.stringify(mcpConfig, null, 2));

    this.log(
      `MCP client configured successfully for workspace: ${workspace.workspaceName}`
    );
  }
}
