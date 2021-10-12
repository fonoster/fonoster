// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Providers proto contains the artificats for the administration
// of Providers.
'use strict';
var grpc = require('@grpc/grpc-js');
var providers_pb = require('./providers_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonos_common_v1beta1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonos.common.v1beta1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_common_v1beta1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_CreateProviderRequest(arg) {
  if (!(arg instanceof providers_pb.CreateProviderRequest)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.CreateProviderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_CreateProviderRequest(buffer_arg) {
  return providers_pb.CreateProviderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_DeleteProviderRequest(arg) {
  if (!(arg instanceof providers_pb.DeleteProviderRequest)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.DeleteProviderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_DeleteProviderRequest(buffer_arg) {
  return providers_pb.DeleteProviderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_GetProviderRequest(arg) {
  if (!(arg instanceof providers_pb.GetProviderRequest)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.GetProviderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_GetProviderRequest(buffer_arg) {
  return providers_pb.GetProviderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_ListProvidersRequest(arg) {
  if (!(arg instanceof providers_pb.ListProvidersRequest)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.ListProvidersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_ListProvidersRequest(buffer_arg) {
  return providers_pb.ListProvidersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_ListProvidersResponse(arg) {
  if (!(arg instanceof providers_pb.ListProvidersResponse)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.ListProvidersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_ListProvidersResponse(buffer_arg) {
  return providers_pb.ListProvidersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_Provider(arg) {
  if (!(arg instanceof providers_pb.Provider)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.Provider');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_Provider(buffer_arg) {
  return providers_pb.Provider.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_providers_v1beta1_UpdateProviderRequest(arg) {
  if (!(arg instanceof providers_pb.UpdateProviderRequest)) {
    throw new Error('Expected argument of type fonos.providers.v1beta1.UpdateProviderRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_providers_v1beta1_UpdateProviderRequest(buffer_arg) {
  return providers_pb.UpdateProviderRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var ProvidersService = exports.ProvidersService = {
  // Lists Providers from the SIP Proxy subsystem
listProviders: {
    path: '/fonos.providers.v1beta1.Providers/ListProviders',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.ListProvidersRequest,
    responseType: providers_pb.ListProvidersResponse,
    requestSerialize: serialize_fonos_providers_v1beta1_ListProvidersRequest,
    requestDeserialize: deserialize_fonos_providers_v1beta1_ListProvidersRequest,
    responseSerialize: serialize_fonos_providers_v1beta1_ListProvidersResponse,
    responseDeserialize: deserialize_fonos_providers_v1beta1_ListProvidersResponse,
  },
  // Creates a new Provider resource.
createProvider: {
    path: '/fonos.providers.v1beta1.Providers/CreateProvider',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.CreateProviderRequest,
    responseType: providers_pb.Provider,
    requestSerialize: serialize_fonos_providers_v1beta1_CreateProviderRequest,
    requestDeserialize: deserialize_fonos_providers_v1beta1_CreateProviderRequest,
    responseSerialize: serialize_fonos_providers_v1beta1_Provider,
    responseDeserialize: deserialize_fonos_providers_v1beta1_Provider,
  },
  // Gets Provider using its reference
getProvider: {
    path: '/fonos.providers.v1beta1.Providers/GetProvider',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.GetProviderRequest,
    responseType: providers_pb.Provider,
    requestSerialize: serialize_fonos_providers_v1beta1_GetProviderRequest,
    requestDeserialize: deserialize_fonos_providers_v1beta1_GetProviderRequest,
    responseSerialize: serialize_fonos_providers_v1beta1_Provider,
    responseDeserialize: deserialize_fonos_providers_v1beta1_Provider,
  },
  // Change or update fields in a resource
updateProvider: {
    path: '/fonos.providers.v1beta1.Providers/UpdateProvider',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.UpdateProviderRequest,
    responseType: providers_pb.Provider,
    requestSerialize: serialize_fonos_providers_v1beta1_UpdateProviderRequest,
    requestDeserialize: deserialize_fonos_providers_v1beta1_UpdateProviderRequest,
    responseSerialize: serialize_fonos_providers_v1beta1_Provider,
    responseDeserialize: deserialize_fonos_providers_v1beta1_Provider,
  },
  // Hard delete of a Provider resource
deleteProvider: {
    path: '/fonos.providers.v1beta1.Providers/DeleteProvider',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.DeleteProviderRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_providers_v1beta1_DeleteProviderRequest,
    requestDeserialize: deserialize_fonos_providers_v1beta1_DeleteProviderRequest,
    responseSerialize: serialize_fonos_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonos_common_v1beta1_Empty,
  },
};

exports.ProvidersClient = grpc.makeGenericClientConstructor(ProvidersService);
