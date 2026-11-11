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
var domains_pb = require('./domains_pb.js');

function serialize_fonoster_domains_v1beta2_CreateDomainRequest(arg) {
  if (!(arg instanceof domains_pb.CreateDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.CreateDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_CreateDomainRequest(buffer_arg) {
  return domains_pb.CreateDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_CreateDomainResponse(arg) {
  if (!(arg instanceof domains_pb.CreateDomainResponse)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.CreateDomainResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_CreateDomainResponse(buffer_arg) {
  return domains_pb.CreateDomainResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_DeleteDomainRequest(arg) {
  if (!(arg instanceof domains_pb.DeleteDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.DeleteDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_DeleteDomainRequest(buffer_arg) {
  return domains_pb.DeleteDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_DeleteDomainResponse(arg) {
  if (!(arg instanceof domains_pb.DeleteDomainResponse)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.DeleteDomainResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_DeleteDomainResponse(buffer_arg) {
  return domains_pb.DeleteDomainResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_Domain(arg) {
  if (!(arg instanceof domains_pb.Domain)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.Domain');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_Domain(buffer_arg) {
  return domains_pb.Domain.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_GetDomainRequest(arg) {
  if (!(arg instanceof domains_pb.GetDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.GetDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_GetDomainRequest(buffer_arg) {
  return domains_pb.GetDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_ListDomainsRequest(arg) {
  if (!(arg instanceof domains_pb.ListDomainsRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.ListDomainsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_ListDomainsRequest(buffer_arg) {
  return domains_pb.ListDomainsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_ListDomainsResponse(arg) {
  if (!(arg instanceof domains_pb.ListDomainsResponse)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.ListDomainsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_ListDomainsResponse(buffer_arg) {
  return domains_pb.ListDomainsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_UpdateDomainRequest(arg) {
  if (!(arg instanceof domains_pb.UpdateDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.UpdateDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_UpdateDomainRequest(buffer_arg) {
  return domains_pb.UpdateDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta2_UpdateDomainResponse(arg) {
  if (!(arg instanceof domains_pb.UpdateDomainResponse)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta2.UpdateDomainResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta2_UpdateDomainResponse(buffer_arg) {
  return domains_pb.UpdateDomainResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Domains service definition
var DomainsService = exports.DomainsService = {
  // Create a new Domain
createDomain: {
    path: '/fonoster.domains.v1beta2.Domains/CreateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.CreateDomainRequest,
    responseType: domains_pb.CreateDomainResponse,
    requestSerialize: serialize_fonoster_domains_v1beta2_CreateDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta2_CreateDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta2_CreateDomainResponse,
    responseDeserialize: deserialize_fonoster_domains_v1beta2_CreateDomainResponse,
  },
  // Update an existing Domain
updateDomain: {
    path: '/fonoster.domains.v1beta2.Domains/UpdateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.UpdateDomainRequest,
    responseType: domains_pb.UpdateDomainResponse,
    requestSerialize: serialize_fonoster_domains_v1beta2_UpdateDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta2_UpdateDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta2_UpdateDomainResponse,
    responseDeserialize: deserialize_fonoster_domains_v1beta2_UpdateDomainResponse,
  },
  // Get an existing Domain
getDomain: {
    path: '/fonoster.domains.v1beta2.Domains/GetDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.GetDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_fonoster_domains_v1beta2_GetDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta2_GetDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta2_Domain,
    responseDeserialize: deserialize_fonoster_domains_v1beta2_Domain,
  },
  // List all Domains
listDomains: {
    path: '/fonoster.domains.v1beta2.Domains/ListDomains',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.ListDomainsRequest,
    responseType: domains_pb.ListDomainsResponse,
    requestSerialize: serialize_fonoster_domains_v1beta2_ListDomainsRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta2_ListDomainsRequest,
    responseSerialize: serialize_fonoster_domains_v1beta2_ListDomainsResponse,
    responseDeserialize: deserialize_fonoster_domains_v1beta2_ListDomainsResponse,
  },
  // Delete an existing Domain
deleteDomain: {
    path: '/fonoster.domains.v1beta2.Domains/DeleteDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.DeleteDomainRequest,
    responseType: domains_pb.DeleteDomainResponse,
    requestSerialize: serialize_fonoster_domains_v1beta2_DeleteDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta2_DeleteDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta2_DeleteDomainResponse,
    responseDeserialize: deserialize_fonoster_domains_v1beta2_DeleteDomainResponse,
  },
};

exports.DomainsClient = grpc.makeGenericClientConstructor(DomainsService, 'Domains');
