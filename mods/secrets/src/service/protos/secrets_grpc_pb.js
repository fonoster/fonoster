// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The SecretMananger proto contains the artificts for Secrets administration
// such as creation and deployment.
'use strict';
var grpc = require('@grpc/grpc-js');
var secrets_pb = require('./secrets_pb.js');
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

function serialize_fonos_secrets_v1beta1_CreateSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.CreateSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_CreateSecretRequest(buffer_arg) {
  return secrets_pb.CreateSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_CreateSecretResponse(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretResponse)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.CreateSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_CreateSecretResponse(buffer_arg) {
  return secrets_pb.CreateSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_DeleteSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.DeleteSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.DeleteSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_DeleteSecretRequest(buffer_arg) {
  return secrets_pb.DeleteSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_GetSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.GetSecretRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.GetSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_GetSecretRequest(buffer_arg) {
  return secrets_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_GetSecretResponse(arg) {
  if (!(arg instanceof secrets_pb.GetSecretResponse)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.GetSecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_GetSecretResponse(buffer_arg) {
  return secrets_pb.GetSecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_ListSecretIdRequest(arg) {
  if (!(arg instanceof secrets_pb.ListSecretIdRequest)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.ListSecretIdRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_ListSecretIdRequest(buffer_arg) {
  return secrets_pb.ListSecretIdRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_secrets_v1beta1_ListSecretIdResponse(arg) {
  if (!(arg instanceof secrets_pb.ListSecretIdResponse)) {
    throw new Error('Expected argument of type fonos.secrets.v1beta1.ListSecretIdResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_secrets_v1beta1_ListSecretIdResponse(buffer_arg) {
  return secrets_pb.ListSecretIdResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var SecretsService = exports.SecretsService = {
  // Lists Secret 
listSecretsId: {
    path: '/fonos.secrets.v1beta1.Secrets/ListSecretsId',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.ListSecretIdRequest,
    responseType: secrets_pb.ListSecretIdResponse,
    requestSerialize: serialize_fonos_secrets_v1beta1_ListSecretIdRequest,
    requestDeserialize: deserialize_fonos_secrets_v1beta1_ListSecretIdRequest,
    responseSerialize: serialize_fonos_secrets_v1beta1_ListSecretIdResponse,
    responseDeserialize: deserialize_fonos_secrets_v1beta1_ListSecretIdResponse,
  },
  // Gets Secret with the Secret-name
getSecret: {
    path: '/fonos.secrets.v1beta1.Secrets/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.GetSecretRequest,
    responseType: secrets_pb.GetSecretResponse,
    requestSerialize: serialize_fonos_secrets_v1beta1_GetSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1beta1_GetSecretRequest,
    responseSerialize: serialize_fonos_secrets_v1beta1_GetSecretResponse,
    responseDeserialize: deserialize_fonos_secrets_v1beta1_GetSecretResponse,
  },
  createSecret: {
    path: '/fonos.secrets.v1beta1.Secrets/CreateSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.CreateSecretRequest,
    responseType: secrets_pb.CreateSecretResponse,
    requestSerialize: serialize_fonos_secrets_v1beta1_CreateSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1beta1_CreateSecretRequest,
    responseSerialize: serialize_fonos_secrets_v1beta1_CreateSecretResponse,
    responseDeserialize: deserialize_fonos_secrets_v1beta1_CreateSecretResponse,
  },
  // Peforms a hard delete of the Secret resource
deleteSecret: {
    path: '/fonos.secrets.v1beta1.Secrets/DeleteSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.DeleteSecretRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_secrets_v1beta1_DeleteSecretRequest,
    requestDeserialize: deserialize_fonos_secrets_v1beta1_DeleteSecretRequest,
    responseSerialize: serialize_fonos_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonos_common_v1beta1_Empty,
  },
};

exports.SecretsClient = grpc.makeGenericClientConstructor(SecretsService);
