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
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');

function serialize_fonoster_auth_v1beta1_CheckAuthorizedRequest(arg) {
  if (!(arg instanceof auth_pb.CheckAuthorizedRequest)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.CheckAuthorizedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_CheckAuthorizedRequest(buffer_arg) {
  return auth_pb.CheckAuthorizedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_CheckAuthorizedResponse(arg) {
  if (!(arg instanceof auth_pb.CheckAuthorizedResponse)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.CheckAuthorizedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_CheckAuthorizedResponse(buffer_arg) {
  return auth_pb.CheckAuthorizedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_CreateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.CreateTokenRequest)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.CreateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_CreateTokenRequest(buffer_arg) {
  return auth_pb.CreateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_CreateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.CreateTokenResponse)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.CreateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_CreateTokenResponse(buffer_arg) {
  return auth_pb.CreateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_GetRoleRequest(arg) {
  if (!(arg instanceof auth_pb.GetRoleRequest)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.GetRoleRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_GetRoleRequest(buffer_arg) {
  return auth_pb.GetRoleRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_Role(arg) {
  if (!(arg instanceof auth_pb.Role)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.Role');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_Role(buffer_arg) {
  return auth_pb.Role.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_ValidateTokenRequest(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenRequest)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.ValidateTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_ValidateTokenRequest(buffer_arg) {
  return auth_pb.ValidateTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_auth_v1beta1_ValidateTokenResponse(arg) {
  if (!(arg instanceof auth_pb.ValidateTokenResponse)) {
    throw new Error('Expected argument of type fonoster.auth.v1beta1.ValidateTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_auth_v1beta1_ValidateTokenResponse(buffer_arg) {
  return auth_pb.ValidateTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var AuthService = exports.AuthService = {
  // Gets a role by name
getRole: {
    path: '/fonoster.auth.v1beta1.Auth/GetRole',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.GetRoleRequest,
    responseType: auth_pb.Role,
    requestSerialize: serialize_fonoster_auth_v1beta1_GetRoleRequest,
    requestDeserialize: deserialize_fonoster_auth_v1beta1_GetRoleRequest,
    responseSerialize: serialize_fonoster_auth_v1beta1_Role,
    responseDeserialize: deserialize_fonoster_auth_v1beta1_Role,
  },
  // Verifies if a token was issue by Fonoster
validateToken: {
    path: '/fonoster.auth.v1beta1.Auth/ValidateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.ValidateTokenRequest,
    responseType: auth_pb.ValidateTokenResponse,
    requestSerialize: serialize_fonoster_auth_v1beta1_ValidateTokenRequest,
    requestDeserialize: deserialize_fonoster_auth_v1beta1_ValidateTokenRequest,
    responseSerialize: serialize_fonoster_auth_v1beta1_ValidateTokenResponse,
    responseDeserialize: deserialize_fonoster_auth_v1beta1_ValidateTokenResponse,
  },
  // Creates a new token for a given accessKeyId
createToken: {
    path: '/fonoster.auth.v1beta1.Auth/CreateToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CreateTokenRequest,
    responseType: auth_pb.CreateTokenResponse,
    requestSerialize: serialize_fonoster_auth_v1beta1_CreateTokenRequest,
    requestDeserialize: deserialize_fonoster_auth_v1beta1_CreateTokenRequest,
    responseSerialize: serialize_fonoster_auth_v1beta1_CreateTokenResponse,
    responseDeserialize: deserialize_fonoster_auth_v1beta1_CreateTokenResponse,
  },
  // Creates a special token that has no access but serves a signature
createNoAccessToken: {
    path: '/fonoster.auth.v1beta1.Auth/CreateNoAccessToken',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CreateTokenRequest,
    responseType: auth_pb.CreateTokenResponse,
    requestSerialize: serialize_fonoster_auth_v1beta1_CreateTokenRequest,
    requestDeserialize: deserialize_fonoster_auth_v1beta1_CreateTokenRequest,
    responseSerialize: serialize_fonoster_auth_v1beta1_CreateTokenResponse,
    responseDeserialize: deserialize_fonoster_auth_v1beta1_CreateTokenResponse,
  },
};

exports.AuthClient = grpc.makeGenericClientConstructor(AuthService);
var LimiterService = exports.LimiterService = {
  checkAuthorized: {
    path: '/fonoster.auth.v1beta1.Limiter/CheckAuthorized',
    requestStream: false,
    responseStream: false,
    requestType: auth_pb.CheckAuthorizedRequest,
    responseType: auth_pb.CheckAuthorizedResponse,
    requestSerialize: serialize_fonoster_auth_v1beta1_CheckAuthorizedRequest,
    requestDeserialize: deserialize_fonoster_auth_v1beta1_CheckAuthorizedRequest,
    responseSerialize: serialize_fonoster_auth_v1beta1_CheckAuthorizedResponse,
    responseDeserialize: deserialize_fonoster_auth_v1beta1_CheckAuthorizedResponse,
  },
};

exports.LimiterClient = grpc.makeGenericClientConstructor(LimiterService);
