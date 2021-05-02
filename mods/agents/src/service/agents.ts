import grpc from "grpc";
import {
  Agent,
  ListAgentsRequest,
  ListAgentsResponse,
  GetAgentRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  DeleteAgentRequest
} from "./protos/agents_pb";
import {Empty} from "./protos/common_pb";
import {
  IAgentsServer,
  IAgentsService,
  AgentsService
} from "./protos/agents_grpc_pb";
import {Kind, ResourceBuilder} from "@fonos/core";
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonos/core";
import decoder from "./decoder";

class AgentsServer extends ResourceServer implements IAgentsServer {
  async listAgents(
    call: grpc.ServerUnaryCall<ListAgentsRequest>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    const result = await super.listResources(Kind.AGENT, call);
    const response = new ListAgentsResponse();
    if (result.resources) {
      const domains = result.resources.map((resource) => decoder(resource));
      response.setNextPageToken(result.nextPageToken + "");
      response.setAgentsList(domains);
    }
    callback(null, response);
  }

  async createAgent(
    call: grpc.ServerUnaryCall<CreateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    const agent = call.request.getAgent();
    try {
      const resource = new ResourceBuilder(Kind.AGENT, agent.getName())
        .withCredentials(agent.getUsername(), agent.getSecret())
        .withDomains(agent.getDomainsList())
        .withMetadata({accessKeyId: getAccessKeyId(call)})
        .build();

      //.withPrivacy(provider.getPrivacy()) // TODO
      const response = await createResource(resource);
      callback(null, decoder(response));
    } catch (e) {
      callback(e, null);
    }
  }

  async updateAgent(
    call: grpc.ServerUnaryCall<UpdateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    const agent = call.request.getAgent();
    try {
      const resource = new ResourceBuilder(
        Kind.AGENT,
        agent.getName(),
        agent.getRef()
      )
        .withCredentials(agent.getUsername(), agent.getSecret())
        .withDomains(agent.getDomainsList())
        .withMetadata({
          createdOn: agent.getCreateTime(),
          modifiedOn: agent.getUpdateTime()
        })
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
    call: grpc.ServerUnaryCall<GetAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    try {
      const result = await super.getResource(Kind.AGENT, call);
      callback(null, decoder(result));
    } catch (e) {
      callback(e, null);
    }
  }

  async deleteAgent(
    call: grpc.ServerUnaryCall<DeleteAgentRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    try {
      await super.deleteResource(Kind.AGENT, call);
      callback(null, new Empty());
    } catch (e) {
      callback(e, null);
    }
  }
}

export {AgentsServer as default, IAgentsService, AgentsService};
