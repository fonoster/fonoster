// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
// http://github.com/fonoster/fonoster
//
// This file is part of Fonoster
//
// Licensed under the MIT License (the "License");
// you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
//
//    https://opensource.org/licenses/MIT
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';
var grpc = require('@grpc/grpc-js');
var agents_pb = require('./agents_pb.js');

function serialize_fonoster_agents_v1beta2_Agent(arg) {
  if (!(arg instanceof agents_pb.Agent)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.Agent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_Agent(buffer_arg) {
  return agents_pb.Agent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_CreateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.CreateAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.CreateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_CreateAgentRequest(buffer_arg) {
  return agents_pb.CreateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_CreateAgentResponse(arg) {
  if (!(arg instanceof agents_pb.CreateAgentResponse)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.CreateAgentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_CreateAgentResponse(buffer_arg) {
  return agents_pb.CreateAgentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_DeleteAgentRequest(arg) {
  if (!(arg instanceof agents_pb.DeleteAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.DeleteAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_DeleteAgentRequest(buffer_arg) {
  return agents_pb.DeleteAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_DeleteAgentResponse(arg) {
  if (!(arg instanceof agents_pb.DeleteAgentResponse)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.DeleteAgentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_DeleteAgentResponse(buffer_arg) {
  return agents_pb.DeleteAgentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_GetAgentRequest(arg) {
  if (!(arg instanceof agents_pb.GetAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.GetAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_GetAgentRequest(buffer_arg) {
  return agents_pb.GetAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_ListAgentsRequest(arg) {
  if (!(arg instanceof agents_pb.ListAgentsRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.ListAgentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_ListAgentsRequest(buffer_arg) {
  return agents_pb.ListAgentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_ListAgentsResponse(arg) {
  if (!(arg instanceof agents_pb.ListAgentsResponse)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.ListAgentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_ListAgentsResponse(buffer_arg) {
  return agents_pb.ListAgentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_UpdateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.UpdateAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.UpdateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_UpdateAgentRequest(buffer_arg) {
  return agents_pb.UpdateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta2_UpdateAgentResponse(arg) {
  if (!(arg instanceof agents_pb.UpdateAgentResponse)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta2.UpdateAgentResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta2_UpdateAgentResponse(buffer_arg) {
  return agents_pb.UpdateAgentResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Agents service definition
var AgentsService = exports.AgentsService = {
  // Create a new Agent
createAgent: {
    path: '/fonoster.agents.v1beta2.Agents/CreateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.CreateAgentRequest,
    responseType: agents_pb.CreateAgentResponse,
    requestSerialize: serialize_fonoster_agents_v1beta2_CreateAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta2_CreateAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta2_CreateAgentResponse,
    responseDeserialize: deserialize_fonoster_agents_v1beta2_CreateAgentResponse,
  },
  // Update an existing Agent
updateAgent: {
    path: '/fonoster.agents.v1beta2.Agents/UpdateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.UpdateAgentRequest,
    responseType: agents_pb.UpdateAgentResponse,
    requestSerialize: serialize_fonoster_agents_v1beta2_UpdateAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta2_UpdateAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta2_UpdateAgentResponse,
    responseDeserialize: deserialize_fonoster_agents_v1beta2_UpdateAgentResponse,
  },
  // Get an existing Agent
getAgent: {
    path: '/fonoster.agents.v1beta2.Agents/GetAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.GetAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonoster_agents_v1beta2_GetAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta2_GetAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta2_Agent,
    responseDeserialize: deserialize_fonoster_agents_v1beta2_Agent,
  },
  // Delete an existing Agent
deleteAgent: {
    path: '/fonoster.agents.v1beta2.Agents/DeleteAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.DeleteAgentRequest,
    responseType: agents_pb.DeleteAgentResponse,
    requestSerialize: serialize_fonoster_agents_v1beta2_DeleteAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta2_DeleteAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta2_DeleteAgentResponse,
    responseDeserialize: deserialize_fonoster_agents_v1beta2_DeleteAgentResponse,
  },
  // List all Agents
listAgents: {
    path: '/fonoster.agents.v1beta2.Agents/ListAgents',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.ListAgentsRequest,
    responseType: agents_pb.ListAgentsResponse,
    requestSerialize: serialize_fonoster_agents_v1beta2_ListAgentsRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta2_ListAgentsRequest,
    responseSerialize: serialize_fonoster_agents_v1beta2_ListAgentsResponse,
    responseDeserialize: deserialize_fonoster_agents_v1beta2_ListAgentsResponse,
  },
};

exports.AgentsClient = grpc.makeGenericClientConstructor(AgentsService, 'Agents');
