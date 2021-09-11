// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Auth proto contains procedures to obtain authentication
// data.
'use strict';
var grpc = require('@grpc/grpc-js');
var auth_pb = require('./auth_pb.js');

function serialize_fonos_auth_v1beta1_CreateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.CreateTokenRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.CreateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_CreateTokenRequest(buffer_arg) {
  return auth_pb.CreateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1beta1_CreateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.CreateTokenResponse)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.CreateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_CreateTokenResponse(buffer_arg) {
  return auth_pb.CreateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1beta1_GetRoleRequest(arg) {
  if (!(arg instanceof auth_pb.GetRoleRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.GetRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_GetRoleRequest(buffer_arg) {
  return auth_pb.GetRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1beta1_Role(arg) {
  if (!(arg instanceof auth_pb.Role)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.Role');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_Role(buffer_arg) {
  return auth_pb.Role.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1beta1_ValidateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.ValidateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_ValidateTokenRequest(buffer_arg) {
  return auth_pb.ValidateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1beta1_ValidateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenResponse)) {
    throw new Error('Expected argument of type fonos.auth.v1beta1.ValidateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1beta1_ValidateTokenResponse(buffer_arg) {
  return auth_pb.ValidateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var AuthService = exports.AuthService = {
  // Gets a role by name
getRole: {
    path: '/fonos.auth.v1beta1.Auth/GetRole',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.GetRoleRequest,
    responseType: auth_pb.Role,
    requestSerialize: serialize_fonos_auth_v1beta1_GetRoleRequest,
    requestDeserialize: deserialize_fonos_auth_v1beta1_GetRoleRequest,
    responseSerialize: serialize_fonos_auth_v1beta1_Role,
    responseDeserialize: deserialize_fonos_auth_v1beta1_Role,
  },
  // Verifies if a token was issue by Fonos or the same private key
validateToken: {
    path: '/fonos.auth.v1beta1.Auth/ValidateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.ValidateTokenRequest,
    responseType: auth_pb.ValidateTokenResponse,
    requestSerialize: serialize_fonos_auth_v1beta1_ValidateTokenRequest,
    requestDeserialize: deserialize_fonos_auth_v1beta1_ValidateTokenRequest,
    responseSerialize: serialize_fonos_auth_v1beta1_ValidateTokenResponse,
    responseDeserialize: deserialize_fonos_auth_v1beta1_ValidateTokenResponse,
  },
  // Creates a new token for a given accessKeyId
createToken: {
    path: '/fonos.auth.v1beta1.Auth/CreateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CreateTokenRequest,
    responseType: auth_pb.CreateTokenResponse,
    requestSerialize: serialize_fonos_auth_v1beta1_CreateTokenRequest,
    requestDeserialize: deserialize_fonos_auth_v1beta1_CreateTokenRequest,
    responseSerialize: serialize_fonos_auth_v1beta1_CreateTokenResponse,
    responseDeserialize: deserialize_fonos_auth_v1beta1_CreateTokenResponse,
  },
  // Creates a special token that has no access but serves a signature
createNoAccessToken: {
    path: '/fonos.auth.v1beta1.Auth/CreateNoAccessToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CreateTokenRequest,
    responseType: auth_pb.CreateTokenResponse,
    requestSerialize: serialize_fonos_auth_v1beta1_CreateTokenRequest,
    requestDeserialize: deserialize_fonos_auth_v1beta1_CreateTokenRequest,
    responseSerialize: serialize_fonos_auth_v1beta1_CreateTokenResponse,
    responseDeserialize: deserialize_fonos_auth_v1beta1_CreateTokenResponse,
  },
};

exports.AuthClient = grpc.makeGenericClientConstructor(AuthService);
