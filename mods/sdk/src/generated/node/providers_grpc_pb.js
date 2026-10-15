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
var providers_pb = require('./providers_pb.js');

function serialize_fonoster_providers_v1beta2_DeleteProviderKeyRequest(arg) {
  if (!(arg instanceof providers_pb.DeleteProviderKeyRequest)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.DeleteProviderKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_DeleteProviderKeyRequest(buffer_arg) {
  return providers_pb.DeleteProviderKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_DeleteProviderKeyResponse(arg) {
  if (!(arg instanceof providers_pb.DeleteProviderKeyResponse)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.DeleteProviderKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_DeleteProviderKeyResponse(buffer_arg) {
  return providers_pb.DeleteProviderKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListCatalogRequest(arg) {
  if (!(arg instanceof providers_pb.ListCatalogRequest)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListCatalogRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListCatalogRequest(buffer_arg) {
  return providers_pb.ListCatalogRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListCatalogResponse(arg) {
  if (!(arg instanceof providers_pb.ListCatalogResponse)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListCatalogResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListCatalogResponse(buffer_arg) {
  return providers_pb.ListCatalogResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListProviderKeysRequest(arg) {
  if (!(arg instanceof providers_pb.ListProviderKeysRequest)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListProviderKeysRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListProviderKeysRequest(buffer_arg) {
  return providers_pb.ListProviderKeysRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListProviderKeysResponse(arg) {
  if (!(arg instanceof providers_pb.ListProviderKeysResponse)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListProviderKeysResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListProviderKeysResponse(buffer_arg) {
  return providers_pb.ListProviderKeysResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListWarningsRequest(arg) {
  if (!(arg instanceof providers_pb.ListWarningsRequest)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListWarningsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListWarningsRequest(buffer_arg) {
  return providers_pb.ListWarningsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ListWarningsResponse(arg) {
  if (!(arg instanceof providers_pb.ListWarningsResponse)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ListWarningsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ListWarningsResponse(buffer_arg) {
  return providers_pb.ListWarningsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_ProviderKey(arg) {
  if (!(arg instanceof providers_pb.ProviderKey)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.ProviderKey');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_ProviderKey(buffer_arg) {
  return providers_pb.ProviderKey.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_providers_v1beta2_SetProviderKeyRequest(arg) {
  if (!(arg instanceof providers_pb.SetProviderKeyRequest)) {
    throw new Error('Expected argument of type fonoster.providers.v1beta2.SetProviderKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_providers_v1beta2_SetProviderKeyRequest(buffer_arg) {
  return providers_pb.SetProviderKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


// The provider catalog (read-only) and the workspace's own vendor keys (add-provider-registry)
var ProvidersService = exports.ProvidersService = {
  // Catalog entries this workspace can use: providers, models and voices (not retired)
listCatalog: {
    path: '/fonoster.providers.v1beta2.Providers/ListCatalog',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.ListCatalogRequest,
    responseType: providers_pb.ListCatalogResponse,
    requestSerialize: serialize_fonoster_providers_v1beta2_ListCatalogRequest,
    requestDeserialize: deserialize_fonoster_providers_v1beta2_ListCatalogRequest,
    responseSerialize: serialize_fonoster_providers_v1beta2_ListCatalogResponse,
    responseDeserialize: deserialize_fonoster_providers_v1beta2_ListCatalogResponse,
  },
  // Store or replace the workspace's key for a provider (kept in a write-only Secret)
setProviderKey: {
    path: '/fonoster.providers.v1beta2.Providers/SetProviderKey',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.SetProviderKeyRequest,
    responseType: providers_pb.ProviderKey,
    requestSerialize: serialize_fonoster_providers_v1beta2_SetProviderKeyRequest,
    requestDeserialize: deserialize_fonoster_providers_v1beta2_SetProviderKeyRequest,
    responseSerialize: serialize_fonoster_providers_v1beta2_ProviderKey,
    responseDeserialize: deserialize_fonoster_providers_v1beta2_ProviderKey,
  },
  // The workspace's provider keys (never the key itself)
listProviderKeys: {
    path: '/fonoster.providers.v1beta2.Providers/ListProviderKeys',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.ListProviderKeysRequest,
    responseType: providers_pb.ListProviderKeysResponse,
    requestSerialize: serialize_fonoster_providers_v1beta2_ListProviderKeysRequest,
    requestDeserialize: deserialize_fonoster_providers_v1beta2_ListProviderKeysRequest,
    responseSerialize: serialize_fonoster_providers_v1beta2_ListProviderKeysResponse,
    responseDeserialize: deserialize_fonoster_providers_v1beta2_ListProviderKeysResponse,
  },
  // Remove the workspace's key for a provider (and its Secret)
deleteProviderKey: {
    path: '/fonoster.providers.v1beta2.Providers/DeleteProviderKey',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.DeleteProviderKeyRequest,
    responseType: providers_pb.DeleteProviderKeyResponse,
    requestSerialize: serialize_fonoster_providers_v1beta2_DeleteProviderKeyRequest,
    requestDeserialize: deserialize_fonoster_providers_v1beta2_DeleteProviderKeyRequest,
    responseSerialize: serialize_fonoster_providers_v1beta2_DeleteProviderKeyResponse,
    responseDeserialize: deserialize_fonoster_providers_v1beta2_DeleteProviderKeyResponse,
  },
  // Deprecated or retired items this workspace uses, with where they are used
listWarnings: {
    path: '/fonoster.providers.v1beta2.Providers/ListWarnings',
    requestStream: false,
    responseStream: false,
    requestType: providers_pb.ListWarningsRequest,
    responseType: providers_pb.ListWarningsResponse,
    requestSerialize: serialize_fonoster_providers_v1beta2_ListWarningsRequest,
    requestDeserialize: deserialize_fonoster_providers_v1beta2_ListWarningsRequest,
    responseSerialize: serialize_fonoster_providers_v1beta2_ListWarningsResponse,
    responseDeserialize: deserialize_fonoster_providers_v1beta2_ListWarningsResponse,
  },
};

exports.ProvidersClient = grpc.makeGenericClientConstructor(ProvidersService, 'Providers');
