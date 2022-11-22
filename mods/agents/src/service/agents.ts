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
import grpc from "@grpc/grpc-js";
import {
  Agent,
  ListAgentsRequest,
  ListAgentsResponse,
  GetAgentRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  DeleteAgentRequest
} from "./protos/agents_pb";
import { Empty } from "./protos/common_pb";
import {
  IAgentsServer,
  IAgentsService,
  AgentsService
} from "./protos/agents_grpc_pb";
import { Kind, ResourceBuilder } from "@fonoster/core";
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonoster/core";
import decoder from "./decoder";
import { Privacy } from "@fonoster/core/src/common/resource_builder";

class AgentsServer implements IAgentsServer {
  [name: string]: grpc.UntypedHandleCall;
  async listAgents(
    call: grpc.ServerUnaryCall<ListAgentsRequest, ListAgentsResponse>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    const result = await ResourceServer.listResources(Kind.AGENT, call);
    const response = new ListAgentsResponse();
    if (result && result.resources) {
      const domains = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setAgentsList(domains);
    }
    callback(null, response);
  }

  async createAgent(
    call: grpc.ServerUnaryCall<CreateAgentRequest, Agent>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    try {
      const privacy =
        call.request.getPrivacy() === Privacy.PRIVATE
          ? Privacy.PRIVATE
          : Privacy.NONE;

      const resource = new ResourceBuilder(Kind.AGENT, call.request.getName())
        .withCredentials(call.request.getUsername(), call.request.getSecret())
        .withDomains(call.request.getDomainsList())
        .withPrivacy(privacy)
        .withMetadata({ accessKeyId: getAccessKeyId(call) })
        .build();

      const response = await createResource(resource);
      callback(null, decoder(response));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateAgent(
    call: grpc.ServerUnaryCall<UpdateAgentRequest, Agent>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    try {
      const agent = (await ResourceServer.getResource(Kind.AGENT, call)) as any;

      const privacy =
        call.request.getPrivacy() === Privacy.PRIVATE
          ? Privacy.PRIVATE
          : Privacy.NONE;

      const resource = new ResourceBuilder(
        Kind.AGENT,
        call.request.getName(),
        call.request.getRef()
      )
        .withCredentials(
          agent?.spec?.credentials?.username,
          call.request.getSecret()
        )
        .withPrivacy(privacy)
        .build();

      const result = await updateResource({
        resource,
        accessKeyId: getAccessKeyId(call)
      });

      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async getAgent(
    call: grpc.ServerUnaryCall<GetAgentRequest, Agent>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    try {
      const result = await ResourceServer.getResource(Kind.AGENT, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteAgent(
    call: grpc.ServerUnaryCall<DeleteAgentRequest, Empty>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await ResourceServer.deleteResource(Kind.AGENT, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export { AgentsServer as default, IAgentsService, AgentsService };
