import grpc from 'grpc'
import {
  Agent,
  ListAgentsRequest,
  ListAgentsResponse,
  GetAgentRequest,
  CreateAgentRequest,
  UpdateAgentRequest,
  DeleteAgentRequest
} from '../protos/agents_pb'
import { Empty } from '../protos/common_pb'
import {
  IAgentsServer,
  IAgentsService,
  AgentsService
} from '../protos/agents_grpc_pb'
import { Kind, REncoder } from '../../common/resource_encoder'
import createResource from '../resources/create_resource'
import updateResource from '../resources/update_resource'
import agentDecoder from '../../common/decoders/agent_decoder'

import { auth } from '../../common/trust_util'
import { FonosAuthError } from '@fonos/errors'
import ResourceServer from '../resources/resource_server'

class AgentsServer extends ResourceServer implements IAgentsServer {
  constructor () {
    super(Kind.AGENT, agentDecoder)
  }

  async listAgents (
    call: grpc.ServerUnaryCall<ListAgentsRequest>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    super.listResources(call, callback)
  }

  async createAgent (
    call: grpc.ServerUnaryCall<CreateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const agent = call.request.getAgent()

    try {
      const resource = new REncoder(Kind.AGENT, agent.getName())
        .withCredentials(agent.getUsername(), agent.getSecret())
        .withDomains(agent.getDomainsList())
        .build()
      //.withPrivacy(provider.getPrivacy()) // TODO
      callback(null, await createResource(resource, agentDecoder))
    } catch (e) {
      callback(e, null)
    }
  }

  async updateAgent (
    call: grpc.ServerUnaryCall<UpdateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const agent = call.request.getAgent()
    try {
      const resource = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
        .withCredentials(agent.getUsername(), agent.getSecret())
        .withDomains(agent.getDomainsList())
        .withMetadata({
          createdOn: agent.getCreateTime(),
          modifiedOn: agent.getUpdateTime()
        })
        .build()
      callback(null, await updateResource(resource, agentDecoder))
    } catch (e) {
      callback(e, null)
    }
  }

  async getAgent (
    call: grpc.ServerUnaryCall<GetAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    super.getResource(call, callback)
  }

  async deleteAgent (
    call: grpc.ServerUnaryCall<DeleteAgentRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    super.deleteResource(call, callback)
  }
}

export { AgentsServer as default, IAgentsService, AgentsService }
