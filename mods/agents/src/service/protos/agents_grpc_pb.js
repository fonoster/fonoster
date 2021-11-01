// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Agents proto contains the artificats for the administration
// of Agents.
'use strict';
var grpc = require('@grpc/grpc-js');
var agents_pb = require('./agents_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonoster_agents_v1beta1_Agent(arg) {
  if (!(arg instanceof agents_pb.Agent)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.Agent');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_Agent(buffer_arg) {
  return agents_pb.Agent.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_CreateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.CreateAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.CreateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_CreateAgentRequest(buffer_arg) {
  return agents_pb.CreateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_DeleteAgentRequest(arg) {
  if (!(arg instanceof agents_pb.DeleteAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.DeleteAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_DeleteAgentRequest(buffer_arg) {
  return agents_pb.DeleteAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_GetAgentRequest(arg) {
  if (!(arg instanceof agents_pb.GetAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.GetAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_GetAgentRequest(buffer_arg) {
  return agents_pb.GetAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_ListAgentsRequest(arg) {
  if (!(arg instanceof agents_pb.ListAgentsRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.ListAgentsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_ListAgentsRequest(buffer_arg) {
  return agents_pb.ListAgentsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_ListAgentsResponse(arg) {
  if (!(arg instanceof agents_pb.ListAgentsResponse)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.ListAgentsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_ListAgentsResponse(buffer_arg) {
  return agents_pb.ListAgentsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_agents_v1beta1_UpdateAgentRequest(arg) {
  if (!(arg instanceof agents_pb.UpdateAgentRequest)) {
    throw new Error('Expected argument of type fonoster.agents.v1beta1.UpdateAgentRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_agents_v1beta1_UpdateAgentRequest(buffer_arg) {
  return agents_pb.UpdateAgentRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_common_v1beta1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonoster.common.v1beta1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_common_v1beta1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var AgentsService = exports.AgentsService = {
  // Lists Agents from the SIP Proxy subsystem
listAgents: {
    path: '/fonoster.agents.v1beta1.Agents/ListAgents',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.ListAgentsRequest,
    responseType: agents_pb.ListAgentsResponse,
    requestSerialize: serialize_fonoster_agents_v1beta1_ListAgentsRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta1_ListAgentsRequest,
    responseSerialize: serialize_fonoster_agents_v1beta1_ListAgentsResponse,
    responseDeserialize: deserialize_fonoster_agents_v1beta1_ListAgentsResponse,
  },
  // Creates a new Agent resource
createAgent: {
    path: '/fonoster.agents.v1beta1.Agents/CreateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.CreateAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonoster_agents_v1beta1_CreateAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta1_CreateAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta1_Agent,
    responseDeserialize: deserialize_fonoster_agents_v1beta1_Agent,
  },
  // Gets Agent by reference
getAgent: {
    path: '/fonoster.agents.v1beta1.Agents/GetAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.GetAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonoster_agents_v1beta1_GetAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta1_GetAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta1_Agent,
    responseDeserialize: deserialize_fonoster_agents_v1beta1_Agent,
  },
  // Change or update fields in a resource
updateAgent: {
    path: '/fonoster.agents.v1beta1.Agents/UpdateAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.UpdateAgentRequest,
    responseType: agents_pb.Agent,
    requestSerialize: serialize_fonoster_agents_v1beta1_UpdateAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta1_UpdateAgentRequest,
    responseSerialize: serialize_fonoster_agents_v1beta1_Agent,
    responseDeserialize: deserialize_fonoster_agents_v1beta1_Agent,
  },
  // Hard delete of an Agent resource
deleteAgent: {
    path: '/fonoster.agents.v1beta1.Agents/DeleteAgent',
    requestStream: false,
    responseStream: false,
    requestType: agents_pb.DeleteAgentRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_agents_v1beta1_DeleteAgentRequest,
    requestDeserialize: deserialize_fonoster_agents_v1beta1_DeleteAgentRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
};

exports.AgentsClient = grpc.makeGenericClientConstructor(AgentsService);
