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
var secrets_pb = require('./secrets_pb.js');

function serialize_fonoster_secrets_v1beta2_CreateSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.CreateSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_CreateSecretRequest(buffer_arg) {
  return secrets_pb.CreateSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_CreateSecretResponse(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretResponse)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.CreateSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_CreateSecretResponse(buffer_arg) {
  return secrets_pb.CreateSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_DeleteSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.DeleteSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.DeleteSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_DeleteSecretRequest(buffer_arg) {
  return secrets_pb.DeleteSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_DeleteSecretResponse(arg) {
  if (!(arg instanceof secrets_pb.DeleteSecretResponse)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.DeleteSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_DeleteSecretResponse(buffer_arg) {
  return secrets_pb.DeleteSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_GetSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.GetSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.GetSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_GetSecretRequest(buffer_arg) {
  return secrets_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_ListSecretsRequest(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.ListSecretsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_ListSecretsRequest(buffer_arg) {
  return secrets_pb.ListSecretsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_ListSecretsResponse(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsResponse)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.ListSecretsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_ListSecretsResponse(buffer_arg) {
  return secrets_pb.ListSecretsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_Secret(arg) {
  if (!(arg instanceof secrets_pb.Secret)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.Secret');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_Secret(buffer_arg) {
  return secrets_pb.Secret.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_UpdateSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.UpdateSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.UpdateSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_UpdateSecretRequest(buffer_arg) {
  return secrets_pb.UpdateSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta2_UpdateSecretResponse(arg) {
  if (!(arg instanceof secrets_pb.UpdateSecretResponse)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta2.UpdateSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta2_UpdateSecretResponse(buffer_arg) {
  return secrets_pb.UpdateSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Secrets service definition
var SecretsService = exports.SecretsService = {
  // Creates a new Secret
createSecret: {
    path: '/fonoster.secrets.v1beta2.Secrets/CreateSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.CreateSecretRequest,
    responseType: secrets_pb.CreateSecretResponse,
    requestSerialize: serialize_fonoster_secrets_v1beta2_CreateSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta2_CreateSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta2_CreateSecretResponse,
    responseDeserialize: deserialize_fonoster_secrets_v1beta2_CreateSecretResponse,
  },
  // Updates an existing set of Secret
updateSecret: {
    path: '/fonoster.secrets.v1beta2.Secrets/UpdateSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.UpdateSecretRequest,
    responseType: secrets_pb.UpdateSecretResponse,
    requestSerialize: serialize_fonoster_secrets_v1beta2_UpdateSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta2_UpdateSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta2_UpdateSecretResponse,
    responseDeserialize: deserialize_fonoster_secrets_v1beta2_UpdateSecretResponse,
  },
  // Gets the details of a given set of Secret
getSecret: {
    path: '/fonoster.secrets.v1beta2.Secrets/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.GetSecretRequest,
    responseType: secrets_pb.Secret,
    requestSerialize: serialize_fonoster_secrets_v1beta2_GetSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta2_GetSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta2_Secret,
    responseDeserialize: deserialize_fonoster_secrets_v1beta2_Secret,
  },
  // Deletes an existing Secret
deleteSecret: {
    path: '/fonoster.secrets.v1beta2.Secrets/DeleteSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.DeleteSecretRequest,
    responseType: secrets_pb.DeleteSecretResponse,
    requestSerialize: serialize_fonoster_secrets_v1beta2_DeleteSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta2_DeleteSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta2_DeleteSecretResponse,
    responseDeserialize: deserialize_fonoster_secrets_v1beta2_DeleteSecretResponse,
  },
  // Lists all Secrets
listSecrets: {
    path: '/fonoster.secrets.v1beta2.Secrets/ListSecrets',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.ListSecretsRequest,
    responseType: secrets_pb.ListSecretsResponse,
    requestSerialize: serialize_fonoster_secrets_v1beta2_ListSecretsRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta2_ListSecretsRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta2_ListSecretsResponse,
    responseDeserialize: deserialize_fonoster_secrets_v1beta2_ListSecretsResponse,
  },
};

exports.SecretsClient = grpc.makeGenericClientConstructor(SecretsService, 'Secrets');
