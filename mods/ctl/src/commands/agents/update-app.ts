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
import { UpdateAgentRequest } from "@fonoster/types";
import { confirm } from "@inquirer/prompts";
import { Args } from "@oclif/core";
import { AuthenticatedCommand } from "../../AuthenticatedCommand";
import errorHandler from "../../errorHandler";

export default class UpdateApp extends AuthenticatedCommand<typeof UpdateApp> {
  static override readonly description = "associate an agent with an application for autopilot integration";
  static override readonly examples = [
    "<%= config.bin %> <%= command.id %> REF APP_REF",
    "<%= config.bin %> <%= command.id %> 001 002"
  ];
  static override readonly args = {
    ref: Args.string({
      description: "the Agent's reference",
      required: true
    }),
    appRef: Args.string({
      description: "the Application's reference to associate with the agent",
      required: true
    })
  };

  public async run(): Promise<void> {
    this.log("This utility will help you associate an agent with an application for autopilot integration.");
    this.log("Press ^C at any time to quit.");

    const { args } = await this.parse(UpdateApp);
    const { ref, appRef } = args;
    const client = await this.createSdkClient();
    const agents = new SDK.Agents(client);
    const applications = new SDK.Applications(client);

    // Verify agent exists
    try {
      const agent = await agents.getAgent(ref);
      if (!agent) {
        this.error(`Agent with reference ${ref} not found.`);
        return;
      }
      this.log(`Found agent: ${agent.name} (${agent.username})`);
    } catch (e) {
      this.error(`Agent with reference ${ref} not found.`);
      return;
    }

    // Verify application exists
    try {
      const app = await applications.getApplication(appRef);
      if (!app) {
        this.error(`Application with reference ${appRef} not found.`);
        return;
      }
      this.log(`Found application: ${app.name}`);
    } catch (e) {
      this.error(`Application with reference ${appRef} not found.`);
      return;
    }

    const confirmUpdate = await confirm({
      message: `Are you sure you want to associate agent ${ref} with application ${appRef}?`,
      default: true
    });

    if (!confirmUpdate) {
      this.log("Aborted!");
      return;
    }

    try {
      await agents.updateAgent({
        ref,
        appRef
      } as UpdateAgentRequest);
      this.log(`Successfully associated agent ${ref} with application ${appRef}!`);
    } catch (e) {
      errorHandler(e, this.error.bind(this));
    }
  }
}
