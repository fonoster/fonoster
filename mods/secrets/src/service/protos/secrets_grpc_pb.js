// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The SecretMananger proto contains the artificats for Secrets administration
// such as creation and deployment.
'use strict';
var grpc = require('grpc');
var secrets_pb = require('./secrets_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonos_common_v1alpha1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonos.common.v1alpha1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_common_v1alpha1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_CreateSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.CreateSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_CreateSecretRequest(buffer_arg) {
  return secrets_pb.CreateSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_DeleteSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.DeleteSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.DeleteSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_DeleteSecretRequest(buffer_arg) {
  return secrets_pb.DeleteSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_GetSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.GetSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.GetSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_GetSecretRequest(buffer_arg) {
  return secrets_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_ListSecretsIdRequest(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsIdRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.ListSecretsIdRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_ListSecretsIdRequest(buffer_arg) {
  return secrets_pb.ListSecretsIdRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_ListSecretsIdResponse(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsIdResponse)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.ListSecretsIdResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_ListSecretsIdResponse(buffer_arg) {
  return secrets_pb.ListSecretsIdResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1alpha1_Secret(arg) {
  if (!(arg instanceof secrets_pb.Secret)) {
    throw new Error('Expected argument of type fonos.secrets.v1alpha1.Secret');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1alpha1_Secret(buffer_arg) {
  return secrets_pb.Secret.deserializeBinary(new Uint8Array(buffer_arg));
}


var SecretsService = exports.SecretsService = {
  // Lists Secret Secretlications
listSecretsId: {
    path: '/fonos.secrets.v1alpha1.Secrets/ListSecretsId',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.ListSecretsIdRequest,
    responseType: secrets_pb.ListSecretsIdResponse,
    requestSerialize: serialize_fonos_secrets_v1alpha1_ListSecretsIdRequest,
    requestDeserialize: deserialize_fonos_secrets_v1alpha1_ListSecretsIdRequest,
    responseSerialize: serialize_fonos_secrets_v1alpha1_ListSecretsIdResponse,
    responseDeserialize: deserialize_fonos_secrets_v1alpha1_ListSecretsIdResponse,
  },
  // Gets Secret with the Secret-name
getSecret: {
    path: '/fonos.secrets.v1alpha1.Secrets/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.GetSecretRequest,
    responseType: secrets_pb.Secret,
    requestSerialize: serialize_fonos_secrets_v1alpha1_GetSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1alpha1_GetSecretRequest,
    responseSerialize: serialize_fonos_secrets_v1alpha1_Secret,
    responseDeserialize: deserialize_fonos_secrets_v1alpha1_Secret,
  },
  createSecret: {
    path: '/fonos.secrets.v1alpha1.Secrets/CreateSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.CreateSecretRequest,
    responseType: secrets_pb.Secret,
    requestSerialize: serialize_fonos_secrets_v1alpha1_CreateSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1alpha1_CreateSecretRequest,
    responseSerialize: serialize_fonos_secrets_v1alpha1_Secret,
    responseDeserialize: deserialize_fonos_secrets_v1alpha1_Secret,
  },
  // Peforms a hard delete of the Secret resource
deleteSecret: {
    path: '/fonos.secrets.v1alpha1.Secrets/DeleteSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.DeleteSecretRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_secrets_v1alpha1_DeleteSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1alpha1_DeleteSecretRequest,
    responseSerialize: serialize_fonos_common_v1alpha1_Empty,
    responseDeserialize: deserialize_fonos_common_v1alpha1_Empty,
  },
};

exports.SecretsClient = grpc.makeGenericClientConstructor(SecretsService);
