// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Agents proto contains the artificats for the administration
// of Agents.
'use strict';
var grpc = require('grpc');
var agents_pb = require('./agents_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonos_agents_v1alpha1_Agent(arg) {
  if (!(arg instanceof agents_pb.Agent)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.Agent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_Agent(buffer_arg) {
  return agents_pb.Agent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_CreateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.CreateAgentRequest)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.CreateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_CreateAgentRequest(buffer_arg) {
  return agents_pb.CreateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_DeleteAgentRequest(arg) {
  if (!(arg instanceof agents_pb.DeleteAgentRequest)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.DeleteAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_DeleteAgentRequest(buffer_arg) {
  return agents_pb.DeleteAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_GetAgentRequest(arg) {
  if (!(arg instanceof agents_pb.GetAgentRequest)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.GetAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_GetAgentRequest(buffer_arg) {
  return agents_pb.GetAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_ListAgentsRequest(arg) {
  if (!(arg instanceof agents_pb.ListAgentsRequest)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.ListAgentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_ListAgentsRequest(buffer_arg) {
  return agents_pb.ListAgentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_ListAgentsResponse(arg) {
  if (!(arg instanceof agents_pb.ListAgentsResponse)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.ListAgentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_ListAgentsResponse(buffer_arg) {
  return agents_pb.ListAgentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_agents_v1alpha1_UpdateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.UpdateAgentRequest)) {
    throw new Error('Expected argument of type fonos.agents.v1alpha1.UpdateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_agents_v1alpha1_UpdateAgentRequest(buffer_arg) {
  return agents_pb.UpdateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_common_v1alpha1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonos.common.v1alpha1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_common_v1alpha1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var AgentsService = exports.AgentsService = {
  // Lists Agents from the SIP Proxy subsystem
  listAgents: {
    path: '/fonos.agents.v1alpha1.Agents/ListAgents',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.ListAgentsRequest,
    responseType: agents_pb.ListAgentsResponse,
    requestSerialize: serialize_fonos_agents_v1alpha1_ListAgentsRequest,
    requestDeserialize: deserialize_fonos_agents_v1alpha1_ListAgentsRequest,
    responseSerialize: serialize_fonos_agents_v1alpha1_ListAgentsResponse,
    responseDeserialize: deserialize_fonos_agents_v1alpha1_ListAgentsResponse,
  },
  // Creates a new Agent resource.
  createAgent: {
    path: '/fonos.agents.v1alpha1.Agents/CreateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.CreateAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonos_agents_v1alpha1_CreateAgentRequest,
    requestDeserialize: deserialize_fonos_agents_v1alpha1_CreateAgentRequest,
    responseSerialize: serialize_fonos_agents_v1alpha1_Agent,
    responseDeserialize: deserialize_fonos_agents_v1alpha1_Agent,
  },
  // Gets Agent using its reference
  getAgent: {
    path: '/fonos.agents.v1alpha1.Agents/GetAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.GetAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonos_agents_v1alpha1_GetAgentRequest,
    requestDeserialize: deserialize_fonos_agents_v1alpha1_GetAgentRequest,
    responseSerialize: serialize_fonos_agents_v1alpha1_Agent,
    responseDeserialize: deserialize_fonos_agents_v1alpha1_Agent,
  },
  // Change or update fields in a resource
  updateAgent: {
    path: '/fonos.agents.v1alpha1.Agents/UpdateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.UpdateAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonos_agents_v1alpha1_UpdateAgentRequest,
    requestDeserialize: deserialize_fonos_agents_v1alpha1_UpdateAgentRequest,
    responseSerialize: serialize_fonos_agents_v1alpha1_Agent,
    responseDeserialize: deserialize_fonos_agents_v1alpha1_Agent,
  },
  // Hard delete of a Agent resource
  deleteAgent: {
    path: '/fonos.agents.v1alpha1.Agents/DeleteAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.DeleteAgentRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_agents_v1alpha1_DeleteAgentRequest,
    requestDeserialize: deserialize_fonos_agents_v1alpha1_DeleteAgentRequest,
    responseSerialize: serialize_fonos_common_v1alpha1_Empty,
    responseDeserialize: deserialize_fonos_common_v1alpha1_Empty,
  },
};

exports.AgentsClient = grpc.makeGenericClientConstructor(AgentsService);
