/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable require-jsdoc */
/*
 * Copyright (C) 2023 by Fonoster Inc (https://fonoster.com)
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
import * as c from "./generated/api";
import { IAgentsClient } from "@fonoster/agents";
import {
  CreateAgentRequest,
  CreateAgentResponse,
  DeleteAgentResponse,
  GetAgentResponse,
  ListAgentsRequest,
  ListAgentsResponse,
  UpdateAgentRequest,
  UpdateAgentResponse
} from "../../agents/src/client/types";
import { WebClientOptions } from "./types";
import WebAPIClient from "./web_client";

export default class Agents extends WebAPIClient implements IAgentsClient {
  constructor(options: WebClientOptions) {
    super(c, "AgentsApi", options);
  }

  async createAgent(request: CreateAgentRequest): Promise<CreateAgentResponse> {
    return (await super.run("createAgent", request)) as any;
  }

  async getAgent(ref: string): Promise<GetAgentResponse> {
    return (await super.run("getAgent", ref)) as any;
  }

  async updateAgent(request: UpdateAgentRequest): Promise<UpdateAgentResponse> {
    return (await super.run("updateAgent", request)) as any;
  }

  async listAgents(request: ListAgentsRequest): Promise<ListAgentsResponse> {
    return (await super.run("listAgents", request)) as any;
  }

  async deleteAgent(ref: string): Promise<DeleteAgentResponse> {
    return (await super.run("deleteAgent", ref)) as any;
  }
}
