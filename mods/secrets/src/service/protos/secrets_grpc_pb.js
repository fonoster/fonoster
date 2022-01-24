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
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
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

function serialize_fonoster_secrets_v1beta1_CreateSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.CreateSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.CreateSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_CreateSecretRequest(buffer_arg) {
  return secrets_pb.CreateSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta1_DeleteSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.DeleteSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.DeleteSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_DeleteSecretRequest(buffer_arg) {
  return secrets_pb.DeleteSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta1_GetSecretRequest(arg) {
  if (!(arg instanceof secrets_pb.GetSecretRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.GetSecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_GetSecretRequest(buffer_arg) {
  return secrets_pb.GetSecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta1_ListSecretsIdRequest(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsIdRequest)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.ListSecretsIdRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_ListSecretsIdRequest(buffer_arg) {
  return secrets_pb.ListSecretsIdRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta1_ListSecretsIdResponse(arg) {
  if (!(arg instanceof secrets_pb.ListSecretsIdResponse)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.ListSecretsIdResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_ListSecretsIdResponse(buffer_arg) {
  return secrets_pb.ListSecretsIdResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_secrets_v1beta1_Secret(arg) {
  if (!(arg instanceof secrets_pb.Secret)) {
    throw new Error('Expected argument of type fonoster.secrets.v1beta1.Secret');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_secrets_v1beta1_Secret(buffer_arg) {
  return secrets_pb.Secret.deserializeBinary(new Uint8Array(buffer_arg));
}


var SecretsService = exports.SecretsService = {
  // Lists Secret 
listSecretsId: {
    path: '/fonoster.secrets.v1beta1.Secrets/ListSecretsId',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.ListSecretsIdRequest,
    responseType: secrets_pb.ListSecretsIdResponse,
    requestSerialize: serialize_fonoster_secrets_v1beta1_ListSecretsIdRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta1_ListSecretsIdRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta1_ListSecretsIdResponse,
    responseDeserialize: deserialize_fonoster_secrets_v1beta1_ListSecretsIdResponse,
  },
  createSecret: {
    path: '/fonoster.secrets.v1beta1.Secrets/CreateSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.CreateSecretRequest,
    responseType: secrets_pb.Secret,
    requestSerialize: serialize_fonoster_secrets_v1beta1_CreateSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta1_CreateSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta1_Secret,
    responseDeserialize: deserialize_fonoster_secrets_v1beta1_Secret,
  },
  // Gets Secret with the Secret-name
getSecret: {
    path: '/fonoster.secrets.v1beta1.Secrets/GetSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.GetSecretRequest,
    responseType: secrets_pb.Secret,
    requestSerialize: serialize_fonoster_secrets_v1beta1_GetSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta1_GetSecretRequest,
    responseSerialize: serialize_fonoster_secrets_v1beta1_Secret,
    responseDeserialize: deserialize_fonoster_secrets_v1beta1_Secret,
  },
  // Peforms a hard delete of the Secret resource
deleteSecret: {
    path: '/fonoster.secrets.v1beta1.Secrets/DeleteSecret',
    requestStream: false,
    responseStream: false,
    requestType: secrets_pb.DeleteSecretRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_secrets_v1beta1_DeleteSecretRequest,
    requestDeserialize: deserialize_fonoster_secrets_v1beta1_DeleteSecretRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
};

exports.SecretsClient = grpc.makeGenericClientConstructor(SecretsService);
