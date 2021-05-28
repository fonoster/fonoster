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


var AuthService = exports.AuthService = {
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
};

exports.AuthClient = grpc.makeGenericClientConstructor(AuthService);
