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
var trunks_pb = require('./trunks_pb.js');

function serialize_fonoster_trunks_v1beta2_CreateTrunkRequest(arg) {
  if (!(arg instanceof trunks_pb.CreateTrunkRequest)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.CreateTrunkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_CreateTrunkRequest(buffer_arg) {
  return trunks_pb.CreateTrunkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_CreateTrunkResponse(arg) {
  if (!(arg instanceof trunks_pb.CreateTrunkResponse)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.CreateTrunkResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_CreateTrunkResponse(buffer_arg) {
  return trunks_pb.CreateTrunkResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_DeleteTrunkRequest(arg) {
  if (!(arg instanceof trunks_pb.DeleteTrunkRequest)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.DeleteTrunkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_DeleteTrunkRequest(buffer_arg) {
  return trunks_pb.DeleteTrunkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_DeleteTrunkResponse(arg) {
  if (!(arg instanceof trunks_pb.DeleteTrunkResponse)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.DeleteTrunkResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_DeleteTrunkResponse(buffer_arg) {
  return trunks_pb.DeleteTrunkResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_GetTrunkRequest(arg) {
  if (!(arg instanceof trunks_pb.GetTrunkRequest)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.GetTrunkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_GetTrunkRequest(buffer_arg) {
  return trunks_pb.GetTrunkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_ListTrunksRequest(arg) {
  if (!(arg instanceof trunks_pb.ListTrunksRequest)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.ListTrunksRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_ListTrunksRequest(buffer_arg) {
  return trunks_pb.ListTrunksRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_ListTrunksResponse(arg) {
  if (!(arg instanceof trunks_pb.ListTrunksResponse)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.ListTrunksResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_ListTrunksResponse(buffer_arg) {
  return trunks_pb.ListTrunksResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_Trunk(arg) {
  if (!(arg instanceof trunks_pb.Trunk)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.Trunk');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_Trunk(buffer_arg) {
  return trunks_pb.Trunk.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_UpdateTrunkRequest(arg) {
  if (!(arg instanceof trunks_pb.UpdateTrunkRequest)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.UpdateTrunkRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_UpdateTrunkRequest(buffer_arg) {
  return trunks_pb.UpdateTrunkRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_trunks_v1beta2_UpdateTrunkResponse(arg) {
  if (!(arg instanceof trunks_pb.UpdateTrunkResponse)) {
    throw new Error('Expected argument of type fonoster.trunks.v1beta2.UpdateTrunkResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_trunks_v1beta2_UpdateTrunkResponse(buffer_arg) {
  return trunks_pb.UpdateTrunkResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Trunks service definition
var TrunksService = exports.TrunksService = {
  // Create a new Trunk
createTrunk: {
    path: '/fonoster.trunks.v1beta2.Trunks/CreateTrunk',
    requestStream: false,
    responseStream: false,
    requestType: trunks_pb.CreateTrunkRequest,
    responseType: trunks_pb.CreateTrunkResponse,
    requestSerialize: serialize_fonoster_trunks_v1beta2_CreateTrunkRequest,
    requestDeserialize: deserialize_fonoster_trunks_v1beta2_CreateTrunkRequest,
    responseSerialize: serialize_fonoster_trunks_v1beta2_CreateTrunkResponse,
    responseDeserialize: deserialize_fonoster_trunks_v1beta2_CreateTrunkResponse,
  },
  // UpdateTrunk an existing Trunk
updateTrunk: {
    path: '/fonoster.trunks.v1beta2.Trunks/UpdateTrunk',
    requestStream: false,
    responseStream: false,
    requestType: trunks_pb.UpdateTrunkRequest,
    responseType: trunks_pb.UpdateTrunkResponse,
    requestSerialize: serialize_fonoster_trunks_v1beta2_UpdateTrunkRequest,
    requestDeserialize: deserialize_fonoster_trunks_v1beta2_UpdateTrunkRequest,
    responseSerialize: serialize_fonoster_trunks_v1beta2_UpdateTrunkResponse,
    responseDeserialize: deserialize_fonoster_trunks_v1beta2_UpdateTrunkResponse,
  },
  // Get a Trunk by reference
getTrunk: {
    path: '/fonoster.trunks.v1beta2.Trunks/GetTrunk',
    requestStream: false,
    responseStream: false,
    requestType: trunks_pb.GetTrunkRequest,
    responseType: trunks_pb.Trunk,
    requestSerialize: serialize_fonoster_trunks_v1beta2_GetTrunkRequest,
    requestDeserialize: deserialize_fonoster_trunks_v1beta2_GetTrunkRequest,
    responseSerialize: serialize_fonoster_trunks_v1beta2_Trunk,
    responseDeserialize: deserialize_fonoster_trunks_v1beta2_Trunk,
  },
  // Delete a Trunk by reference
deleteTrunk: {
    path: '/fonoster.trunks.v1beta2.Trunks/DeleteTrunk',
    requestStream: false,
    responseStream: false,
    requestType: trunks_pb.DeleteTrunkRequest,
    responseType: trunks_pb.DeleteTrunkResponse,
    requestSerialize: serialize_fonoster_trunks_v1beta2_DeleteTrunkRequest,
    requestDeserialize: deserialize_fonoster_trunks_v1beta2_DeleteTrunkRequest,
    responseSerialize: serialize_fonoster_trunks_v1beta2_DeleteTrunkResponse,
    responseDeserialize: deserialize_fonoster_trunks_v1beta2_DeleteTrunkResponse,
  },
  // List all Trunks
listTrunks: {
    path: '/fonoster.trunks.v1beta2.Trunks/ListTrunks',
    requestStream: false,
    responseStream: false,
    requestType: trunks_pb.ListTrunksRequest,
    responseType: trunks_pb.ListTrunksResponse,
    requestSerialize: serialize_fonoster_trunks_v1beta2_ListTrunksRequest,
    requestDeserialize: deserialize_fonoster_trunks_v1beta2_ListTrunksRequest,
    responseSerialize: serialize_fonoster_trunks_v1beta2_ListTrunksResponse,
    responseDeserialize: deserialize_fonoster_trunks_v1beta2_ListTrunksResponse,
  },
};

exports.TrunksClient = grpc.makeGenericClientConstructor(TrunksService, 'Trunks');
