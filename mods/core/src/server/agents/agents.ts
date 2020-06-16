import grpc from 'grpc'
import updateAgent from '../resources/update_resource'
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
import deleteResource from '../resources/delete_resource'
import { Kind, REncoder } from '../../common/resource_encoder'
import getResource from '../resources/get_resource'
import listResources from '../resources/list_resources'
import createResource from '../resources/create_resource'
import updateResource from '../resources/update_resource'
import agentDecoder from '../../common/decoders/agent_decoder'

import { auth } from '../../common/trust_util'
import { FonosAuthError } from '@fonos/errors'

class AgentsServer implements IAgentsServer {
  async listAgents (
    call: grpc.ServerUnaryCall<ListAgentsRequest>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const r: any = await listResources(
      parseInt(call.request.getPageToken()),
      call.request.getPageSize(),
      agentDecoder
    )
    callback(null, r)
  }

  async createAgent (
    call: grpc.ServerUnaryCall<CreateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const agent = call.request.getAgent()
    const resource = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
      .withCredentials(agent.getUsername(), agent.getSecret())
      .withDomains(agent.getDomainsList())
      .build()
    //.withPrivacy(provider.getPrivacy()) // TODO
    callback(null, await createResource(resource, agentDecoder))
  }

  async updateAgent (
    call: grpc.ServerUnaryCall<UpdateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    const agent = call.request.getAgent()
    const resource = new REncoder(Kind.AGENT, agent.getName(), agent.getRef())
      .withCredentials(agent.getUsername(), agent.getSecret())
      .withDomains(agent.getDomainsList())
      .withMetadata({
        createdOn: agent.getCreateTime(),
        modifiedOn: agent.getUpdateTime()
      })
      .build()
    callback(null, await updateResource(resource, agentDecoder))
  }

  async getAgent (
    call: grpc.ServerUnaryCall<GetAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(
      null,
      await getResource(call.request.getRef(), Kind.AGENT, agentDecoder)
    )
  }

  async deleteAgent (
    call: grpc.ServerUnaryCall<DeleteAgentRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    if (!auth(call)) return callback(new FonosAuthError(), null)
    callback(null, await deleteResource(call.request.getRef(), Kind.AGENT))
  }
}

export { AgentsServer as default, IAgentsService, AgentsService }
