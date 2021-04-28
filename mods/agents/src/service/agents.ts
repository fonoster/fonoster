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
import {Kind, ResourceBuilder} from "@fonos/core/src/common/resource_builder";
import agentDecoder from "./decoder";
import {
  updateResource,
  createResource,
  ResourceServer,
  getAccessKeyId
} from "@fonos/core"

class AgentsServer extends ResourceServer implements IAgentsServer {
  async listAgents(
    call: grpc.ServerUnaryCall<ListAgentsRequest>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    super.listResources(Kind.AGENT, call);
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
      callback(null, await createResource(resource));
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
      const resource = new ResourceBuilder(Kind.AGENT, agent.getName(), agent.getRef())
        .withCredentials(agent.getUsername(), agent.getSecret())
        .withDomains(agent.getDomainsList())
        .withMetadata({
          createdOn: agent.getCreateTime(),
          modifiedOn: agent.getUpdateTime()
        })
        .build();
      callback(
        null,
        null
        // await updateResource(getAccessKeyId(call), resource, agentDecoder)
      );
    } catch (e) {
      callback(e, null);
    }
  }

  async getAgent(
    call: grpc.ServerUnaryCall<GetAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    super.getResource(Kind.AGENT, call);
  }

  async deleteAgent(
    call: grpc.ServerUnaryCall<DeleteAgentRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(Kind.AGENT, call);
  }
}

export {AgentsServer as default, IAgentsService, AgentsService};
