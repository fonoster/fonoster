// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Domains proto contains the artificats for domains administration
'use strict';
var grpc = require('@grpc/grpc-js');
var domains_pb = require('./domains_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonoster_common_v1beta1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonoster.common.v1beta1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_common_v1beta1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_CreateDomainRequest(arg) {
  if (!(arg instanceof domains_pb.CreateDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.CreateDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_CreateDomainRequest(buffer_arg) {
  return domains_pb.CreateDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_DeleteDomainRequest(arg) {
  if (!(arg instanceof domains_pb.DeleteDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.DeleteDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_DeleteDomainRequest(buffer_arg) {
  return domains_pb.DeleteDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_Domain(arg) {
  if (!(arg instanceof domains_pb.Domain)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.Domain');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_Domain(buffer_arg) {
  return domains_pb.Domain.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_GetDomainRequest(arg) {
  if (!(arg instanceof domains_pb.GetDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.GetDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_GetDomainRequest(buffer_arg) {
  return domains_pb.GetDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_ListDomainsRequest(arg) {
  if (!(arg instanceof domains_pb.ListDomainsRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.ListDomainsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_ListDomainsRequest(buffer_arg) {
  return domains_pb.ListDomainsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_ListDomainsResponse(arg) {
  if (!(arg instanceof domains_pb.ListDomainsResponse)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.ListDomainsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_ListDomainsResponse(buffer_arg) {
  return domains_pb.ListDomainsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_domains_v1beta1_UpdateDomainRequest(arg) {
  if (!(arg instanceof domains_pb.UpdateDomainRequest)) {
    throw new Error('Expected argument of type fonoster.domains.v1beta1.UpdateDomainRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_domains_v1beta1_UpdateDomainRequest(buffer_arg) {
  return domains_pb.UpdateDomainRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var DomainsService = exports.DomainsService = {
  // Lists domains from the SIP Proxy subsystem
listDomains: {
    path: '/fonoster.domains.v1beta1.Domains/ListDomains',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.ListDomainsRequest,
    responseType: domains_pb.ListDomainsResponse,
    requestSerialize: serialize_fonoster_domains_v1beta1_ListDomainsRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta1_ListDomainsRequest,
    responseSerialize: serialize_fonoster_domains_v1beta1_ListDomainsResponse,
    responseDeserialize: deserialize_fonoster_domains_v1beta1_ListDomainsResponse,
  },
  // Creates a new Domain resource
createDomain: {
    path: '/fonoster.domains.v1beta1.Domains/CreateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.CreateDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_fonoster_domains_v1beta1_CreateDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta1_CreateDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta1_Domain,
    responseDeserialize: deserialize_fonoster_domains_v1beta1_Domain,
  },
  // Gets a Domain by reference
getDomain: {
    path: '/fonoster.domains.v1beta1.Domains/GetDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.GetDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_fonoster_domains_v1beta1_GetDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta1_GetDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta1_Domain,
    responseDeserialize: deserialize_fonoster_domains_v1beta1_Domain,
  },
  // Change or update fields in a resource
updateDomain: {
    path: '/fonoster.domains.v1beta1.Domains/UpdateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.UpdateDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_fonoster_domains_v1beta1_UpdateDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta1_UpdateDomainRequest,
    responseSerialize: serialize_fonoster_domains_v1beta1_Domain,
    responseDeserialize: deserialize_fonoster_domains_v1beta1_Domain,
  },
  // Hard delete of a domain resource
deleteDomain: {
    path: '/fonoster.domains.v1beta1.Domains/DeleteDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.DeleteDomainRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_domains_v1beta1_DeleteDomainRequest,
    requestDeserialize: deserialize_fonoster_domains_v1beta1_DeleteDomainRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
};

exports.DomainsClient = grpc.makeGenericClientConstructor(DomainsService);
