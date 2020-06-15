import grpc from 'grpc'
import listAgents from './list_agents'
import createAgent from './create_agent'
import getAgent from './get_agent'
import deleteAgent from './delete_agent'
import updateAgent from './update_agent'
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

class AgentsServer implements IAgentsServer {
  async listAgents (
    call: grpc.ServerUnaryCall<ListAgentsRequest>,
    callback: grpc.sendUnaryData<ListAgentsResponse>
  ) {
    listAgents(call, callback)
  }

  async createAgent (
    call: grpc.ServerUnaryCall<CreateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    createAgent(call, callback)
  }

  async updateAgent (
    call: grpc.ServerUnaryCall<UpdateAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    updateAgent(call, callback)
  }

  async getAgent (
    call: grpc.ServerUnaryCall<GetAgentRequest>,
    callback: grpc.sendUnaryData<Agent>
  ) {
    getAgent(call, callback)
  }

  async deleteAgent (
    call: grpc.ServerUnaryCall<DeleteAgentRequest>,
    callback: grpc.sendUnaryData<Empty>
  ) {
    deleteAgent(call, callback)
  }
}

export { AgentsServer as default, IAgentsService, AgentsService }
