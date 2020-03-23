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

function serialize_yaps_domains_v1alpha1_Domain (arg) {
  if (!(arg instanceof domains_pb.Domain)) {
    throw new Error('Expected argument of type yaps.domains.v1alpha1.Domain')
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_yaps_domains_v1alpha1_Domain (buffer_arg) {
  return domains_pb.Domain.deserializeBinary(new Uint8Array(buffer_arg))
}

var DomainsService = (exports.DomainsService = {
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
  }
})

exports.DomainsClient = grpc.makeGenericClientConstructor(DomainsService)
