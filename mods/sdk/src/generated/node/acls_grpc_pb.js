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
var acls_pb = require('./acls_pb.js');

function serialize_fonoster_acls_v1beta2_Acl(arg) {
  if (!(arg instanceof acls_pb.Acl)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.Acl');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_Acl(buffer_arg) {
  return acls_pb.Acl.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_CreateAclRequest(arg) {
  if (!(arg instanceof acls_pb.CreateAclRequest)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.CreateAclRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_CreateAclRequest(buffer_arg) {
  return acls_pb.CreateAclRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_CreateAclResponse(arg) {
  if (!(arg instanceof acls_pb.CreateAclResponse)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.CreateAclResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_CreateAclResponse(buffer_arg) {
  return acls_pb.CreateAclResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_DeleteAclRequest(arg) {
  if (!(arg instanceof acls_pb.DeleteAclRequest)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.DeleteAclRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_DeleteAclRequest(buffer_arg) {
  return acls_pb.DeleteAclRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_DeleteAclResponse(arg) {
  if (!(arg instanceof acls_pb.DeleteAclResponse)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.DeleteAclResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_DeleteAclResponse(buffer_arg) {
  return acls_pb.DeleteAclResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_GetAclRequest(arg) {
  if (!(arg instanceof acls_pb.GetAclRequest)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.GetAclRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_GetAclRequest(buffer_arg) {
  return acls_pb.GetAclRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_ListAclsRequest(arg) {
  if (!(arg instanceof acls_pb.ListAclsRequest)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.ListAclsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_ListAclsRequest(buffer_arg) {
  return acls_pb.ListAclsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_ListAclsResponse(arg) {
  if (!(arg instanceof acls_pb.ListAclsResponse)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.ListAclsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_ListAclsResponse(buffer_arg) {
  return acls_pb.ListAclsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_UpdateAclRequest(arg) {
  if (!(arg instanceof acls_pb.UpdateAclRequest)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.UpdateAclRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_UpdateAclRequest(buffer_arg) {
  return acls_pb.UpdateAclRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_acls_v1beta2_UpdateAclResponse(arg) {
  if (!(arg instanceof acls_pb.UpdateAclResponse)) {
    throw new Error('Expected argument of type fonoster.acls.v1beta2.UpdateAclResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_acls_v1beta2_UpdateAclResponse(buffer_arg) {
  return acls_pb.UpdateAclResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// AccessControlList(Acl) service definition
var AclsService = exports.AclsService = {
  // Create a new Acl
createAcl: {
    path: '/fonoster.acls.v1beta2.Acls/CreateAcl',
    requestStream: false,
    responseStream: false,
    requestType: acls_pb.CreateAclRequest,
    responseType: acls_pb.CreateAclResponse,
    requestSerialize: serialize_fonoster_acls_v1beta2_CreateAclRequest,
    requestDeserialize: deserialize_fonoster_acls_v1beta2_CreateAclRequest,
    responseSerialize: serialize_fonoster_acls_v1beta2_CreateAclResponse,
    responseDeserialize: deserialize_fonoster_acls_v1beta2_CreateAclResponse,
  },
  // Update an existing Acl
updateAcl: {
    path: '/fonoster.acls.v1beta2.Acls/UpdateAcl',
    requestStream: false,
    responseStream: false,
    requestType: acls_pb.UpdateAclRequest,
    responseType: acls_pb.UpdateAclResponse,
    requestSerialize: serialize_fonoster_acls_v1beta2_UpdateAclRequest,
    requestDeserialize: deserialize_fonoster_acls_v1beta2_UpdateAclRequest,
    responseSerialize: serialize_fonoster_acls_v1beta2_UpdateAclResponse,
    responseDeserialize: deserialize_fonoster_acls_v1beta2_UpdateAclResponse,
  },
  // Get an existing Acl
getAcl: {
    path: '/fonoster.acls.v1beta2.Acls/GetAcl',
    requestStream: false,
    responseStream: false,
    requestType: acls_pb.GetAclRequest,
    responseType: acls_pb.Acl,
    requestSerialize: serialize_fonoster_acls_v1beta2_GetAclRequest,
    requestDeserialize: deserialize_fonoster_acls_v1beta2_GetAclRequest,
    responseSerialize: serialize_fonoster_acls_v1beta2_Acl,
    responseDeserialize: deserialize_fonoster_acls_v1beta2_Acl,
  },
  // Delete an existing Acl
deleteAcl: {
    path: '/fonoster.acls.v1beta2.Acls/DeleteAcl',
    requestStream: false,
    responseStream: false,
    requestType: acls_pb.DeleteAclRequest,
    responseType: acls_pb.DeleteAclResponse,
    requestSerialize: serialize_fonoster_acls_v1beta2_DeleteAclRequest,
    requestDeserialize: deserialize_fonoster_acls_v1beta2_DeleteAclRequest,
    responseSerialize: serialize_fonoster_acls_v1beta2_DeleteAclResponse,
    responseDeserialize: deserialize_fonoster_acls_v1beta2_DeleteAclResponse,
  },
  // Get a list of Acls
listAcls: {
    path: '/fonoster.acls.v1beta2.Acls/ListAcls',
    requestStream: false,
    responseStream: false,
    requestType: acls_pb.ListAclsRequest,
    responseType: acls_pb.ListAclsResponse,
    requestSerialize: serialize_fonoster_acls_v1beta2_ListAclsRequest,
    requestDeserialize: deserialize_fonoster_acls_v1beta2_ListAclsRequest,
    responseSerialize: serialize_fonoster_acls_v1beta2_ListAclsResponse,
    responseDeserialize: deserialize_fonoster_acls_v1beta2_ListAclsResponse,
  },
};

exports.AclsClient = grpc.makeGenericClientConstructor(AclsService, 'Acls');
