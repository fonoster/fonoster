// GENERATED CODE -- DO NOT EDIT!
// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Domains proto contains the artificats for domains administration
'use strict'
var grpc = require('grpc')
var domains_pb = require('./domains_pb.js')
var common_pb = require('./common_pb.js')
function serialize_yaps_common_v1alpha1_Empty (arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type yaps.common.v1alpha1.Empty')
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_common_v1alpha1_Empty (buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg))
}
function serialize_yaps_domains_v1alpha1_CreateDomainRequest (arg) {
  if (!(arg instanceof domains_pb.CreateDomainRequest)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.CreateDomainRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_CreateDomainRequest (buffer_arg) {
  return domains_pb.CreateDomainRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_domains_v1alpha1_DeleteDomainRequest (arg) {
  if (!(arg instanceof domains_pb.DeleteDomainRequest)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.DeleteDomainRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_DeleteDomainRequest (buffer_arg) {
  return domains_pb.DeleteDomainRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_domains_v1alpha1_Domain (arg) {
  if (!(arg instanceof domains_pb.Domain)) {
    throw new Error('Expected argument of type yaps.domains.v1alpha1.Domain')
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_Domain (buffer_arg) {
  return domains_pb.Domain.deserializeBinary(new Uint8Array(buffer_arg))
}
function serialize_yaps_domains_v1alpha1_GetDomainRequest (arg) {
  if (!(arg instanceof domains_pb.GetDomainRequest)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.GetDomainRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_GetDomainRequest (buffer_arg) {
  return domains_pb.GetDomainRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_domains_v1alpha1_ListDomainsRequest (arg) {
  if (!(arg instanceof domains_pb.ListDomainsRequest)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.ListDomainsRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_ListDomainsRequest (buffer_arg) {
  return domains_pb.ListDomainsRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_domains_v1alpha1_ListDomainsResponse (arg) {
  if (!(arg instanceof domains_pb.ListDomainsResponse)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.ListDomainsResponse'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_ListDomainsResponse (buffer_arg) {
  return domains_pb.ListDomainsResponse.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_domains_v1alpha1_UpdateDomainRequest (arg) {
  if (!(arg instanceof domains_pb.UpdateDomainRequest)) {
    throw new Error(
      'Expected argument of type yaps.domains.v1alpha1.UpdateDomainRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_domains_v1alpha1_UpdateDomainRequest (buffer_arg) {
  return domains_pb.UpdateDomainRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
var DomainsService = (exports.DomainsService = {
  // Lists domains from the SIP Proxy subsystem
  listDomains: {
    path: '/yaps.domains.v1alpha1.Domains/ListDomains',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.ListDomainsRequest,
    responseType: domains_pb.ListDomainsResponse,
    requestSerialize: serialize_yaps_domains_v1alpha1_ListDomainsRequest,
    requestDeserialize: deserialize_yaps_domains_v1alpha1_ListDomainsRequest,
    responseSerialize: serialize_yaps_domains_v1alpha1_ListDomainsResponse,
    responseDeserialize: deserialize_yaps_domains_v1alpha1_ListDomainsResponse
  },
  // Creates a new Domain resource.
  createDomain: {
    path: '/yaps.domains.v1alpha1.Domains/CreateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.CreateDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_yaps_domains_v1alpha1_CreateDomainRequest,
    requestDeserialize: deserialize_yaps_domains_v1alpha1_CreateDomainRequest,
    responseSerialize: serialize_yaps_domains_v1alpha1_Domain,
    responseDeserialize: deserialize_yaps_domains_v1alpha1_Domain
  },
  // Gets Domain using its reference
  getDomain: {
    path: '/yaps.domains.v1alpha1.Domains/GetDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.GetDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_yaps_domains_v1alpha1_GetDomainRequest,
    requestDeserialize: deserialize_yaps_domains_v1alpha1_GetDomainRequest,
    responseSerialize: serialize_yaps_domains_v1alpha1_Domain,
    responseDeserialize: deserialize_yaps_domains_v1alpha1_Domain
  },
  // Change or update fields in a resource
  updateDomain: {
    path: '/yaps.domains.v1alpha1.Domains/UpdateDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.UpdateDomainRequest,
    responseType: domains_pb.Domain,
    requestSerialize: serialize_yaps_domains_v1alpha1_UpdateDomainRequest,
    requestDeserialize: deserialize_yaps_domains_v1alpha1_UpdateDomainRequest,
    responseSerialize: serialize_yaps_domains_v1alpha1_Domain,
    responseDeserialize: deserialize_yaps_domains_v1alpha1_Domain
  },
  // Hard delete of a domain resource
  deleteDomain: {
    path: '/yaps.domains.v1alpha1.Domains/DeleteDomain',
    requestStream: false,
    responseStream: false,
    requestType: domains_pb.DeleteDomainRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_yaps_domains_v1alpha1_DeleteDomainRequest,
    requestDeserialize: deserialize_yaps_domains_v1alpha1_DeleteDomainRequest,
    responseSerialize: serialize_yaps_common_v1alpha1_Empty,
    responseDeserialize: deserialize_yaps_common_v1alpha1_Empty
  }
})
exports.DomainsClient = grpc.makeGenericClientConstructor(DomainsService)
//# sourceMappingURL=domains_grpc_pb.js.map
