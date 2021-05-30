// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Auth proto contains procedures to obtain authentication
// data.
'use strict';
var grpc = require('grpc');
var auth_pb = require('./auth_pb.js');

function serialize_fonos_auth_v1alpha1_CreateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.CreateTokenRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.CreateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_CreateTokenRequest(buffer_arg) {
  return auth_pb.CreateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1alpha1_CreateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.CreateTokenResponse)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.CreateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_CreateTokenResponse(buffer_arg) {
  return auth_pb.CreateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1alpha1_GetRoleRequest(arg) {
  if (!(arg instanceof auth_pb.GetRoleRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.GetRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_GetRoleRequest(buffer_arg) {
  return auth_pb.GetRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1alpha1_Role(arg) {
  if (!(arg instanceof auth_pb.Role)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.Role');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_Role(buffer_arg) {
  return auth_pb.Role.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1alpha1_ValidateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenRequest)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.ValidateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_ValidateTokenRequest(buffer_arg) {
  return auth_pb.ValidateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_auth_v1alpha1_ValidateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenResponse)) {
    throw new Error('Expected argument of type fonos.auth.v1alpha1.ValidateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_auth_v1alpha1_ValidateTokenResponse(buffer_arg) {
  return auth_pb.ValidateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var AuthService = exports.AuthService = {
  // Gets a role by name
getRole: {
    path: '/fonos.auth.v1alpha1.Auth/GetRole',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.GetRoleRequest,
    responseType: auth_pb.Role,
    requestSerialize: serialize_fonos_auth_v1alpha1_GetRoleRequest,
    requestDeserialize: deserialize_fonos_auth_v1alpha1_GetRoleRequest,
    responseSerialize: serialize_fonos_auth_v1alpha1_Role,
    responseDeserialize: deserialize_fonos_auth_v1alpha1_Role,
  },
  // Verifies if a token was issue by Fonos or the same private key
validateToken: {
    path: '/fonos.auth.v1alpha1.Auth/ValidateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.ValidateTokenRequest,
    responseType: auth_pb.ValidateTokenResponse,
    requestSerialize: serialize_fonos_auth_v1alpha1_ValidateTokenRequest,
    requestDeserialize: deserialize_fonos_auth_v1alpha1_ValidateTokenRequest,
    responseSerialize: serialize_fonos_auth_v1alpha1_ValidateTokenResponse,
    responseDeserialize: deserialize_fonos_auth_v1alpha1_ValidateTokenResponse,
  },
  // Verifies if a token was issue by Fonos or the same private key
createToken: {
    path: '/fonos.auth.v1alpha1.Auth/CreateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CreateTokenRequest,
    responseType: auth_pb.CreateTokenResponse,
    requestSerialize: serialize_fonos_auth_v1alpha1_CreateTokenRequest,
    requestDeserialize: deserialize_fonos_auth_v1alpha1_CreateTokenRequest,
    responseSerialize: serialize_fonos_auth_v1alpha1_CreateTokenResponse,
    responseDeserialize: deserialize_fonos_auth_v1alpha1_CreateTokenResponse,
  },
};

exports.AuthClient = grpc.makeGenericClientConstructor(AuthService);
