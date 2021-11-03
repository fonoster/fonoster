// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Users proto contains the artificats for the administration
// of Users.
'use strict';
var grpc = require('@grpc/grpc-js');
var users_pb = require('./users_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');
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

function serialize_fonoster_users_v1beta1_CreateUserCredentialsRequest(arg) {
  if (!(arg instanceof users_pb.CreateUserCredentialsRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.CreateUserCredentialsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_CreateUserCredentialsRequest(buffer_arg) {
  return users_pb.CreateUserCredentialsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_CreateUserCredentialsResponse(arg) {
  if (!(arg instanceof users_pb.CreateUserCredentialsResponse)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.CreateUserCredentialsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_CreateUserCredentialsResponse(buffer_arg) {
  return users_pb.CreateUserCredentialsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_CreateUserRequest(arg) {
  if (!(arg instanceof users_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_CreateUserRequest(buffer_arg) {
  return users_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_DeleteUserRequest(arg) {
  if (!(arg instanceof users_pb.DeleteUserRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.DeleteUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_DeleteUserRequest(buffer_arg) {
  return users_pb.DeleteUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_GetUserRequest(arg) {
  if (!(arg instanceof users_pb.GetUserRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.GetUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_GetUserRequest(buffer_arg) {
  return users_pb.GetUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_ListUsersRequest(arg) {
  if (!(arg instanceof users_pb.ListUsersRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.ListUsersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_ListUsersRequest(buffer_arg) {
  return users_pb.ListUsersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_ListUsersResponse(arg) {
  if (!(arg instanceof users_pb.ListUsersResponse)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.ListUsersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_ListUsersResponse(buffer_arg) {
  return users_pb.ListUsersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_UpdateUserRequest(arg) {
  if (!(arg instanceof users_pb.UpdateUserRequest)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.UpdateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_UpdateUserRequest(buffer_arg) {
  return users_pb.UpdateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_users_v1beta1_User(arg) {
  if (!(arg instanceof users_pb.User)) {
    throw new Error('Expected argument of type fonoster.users.v1beta1.User');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_users_v1beta1_User(buffer_arg) {
  return users_pb.User.deserializeBinary(new Uint8Array(buffer_arg));
}


var UsersService = exports.UsersService = {
  // Lists all the Users you have access to
listUsers: {
    path: '/fonoster.users.v1beta1.Users/ListUsers',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.ListUsersRequest,
    responseType: users_pb.ListUsersResponse,
    requestSerialize: serialize_fonoster_users_v1beta1_ListUsersRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_ListUsersRequest,
    responseSerialize: serialize_fonoster_users_v1beta1_ListUsersResponse,
    responseDeserialize: deserialize_fonoster_users_v1beta1_ListUsersResponse,
  },
  // Creates a new User resource
createUser: {
    path: '/fonoster.users.v1beta1.Users/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.CreateUserRequest,
    responseType: users_pb.User,
    requestSerialize: serialize_fonoster_users_v1beta1_CreateUserRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_CreateUserRequest,
    responseSerialize: serialize_fonoster_users_v1beta1_User,
    responseDeserialize: deserialize_fonoster_users_v1beta1_User,
  },
  // Gets User by reference
getUser: {
    path: '/fonoster.users.v1beta1.Users/GetUser',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.GetUserRequest,
    responseType: users_pb.User,
    requestSerialize: serialize_fonoster_users_v1beta1_GetUserRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_GetUserRequest,
    responseSerialize: serialize_fonoster_users_v1beta1_User,
    responseDeserialize: deserialize_fonoster_users_v1beta1_User,
  },
  // Change or update fields in a resource
updateUser: {
    path: '/fonoster.users.v1beta1.Users/UpdateUser',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.UpdateUserRequest,
    responseType: users_pb.User,
    requestSerialize: serialize_fonoster_users_v1beta1_UpdateUserRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_UpdateUserRequest,
    responseSerialize: serialize_fonoster_users_v1beta1_User,
    responseDeserialize: deserialize_fonoster_users_v1beta1_User,
  },
  // WARNING: Hard delete of an User will remove all related projects and its resources. 
deleteUser: {
    path: '/fonoster.users.v1beta1.Users/DeleteUser',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.DeleteUserRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_users_v1beta1_DeleteUserRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_DeleteUserRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
  // Creates a set of credentials
createUserCredentials: {
    path: '/fonoster.users.v1beta1.Users/CreateUserCredentials',
    requestStream: false,
    responseStream: false,
    requestType: users_pb.CreateUserCredentialsRequest,
    responseType: users_pb.CreateUserCredentialsResponse,
    requestSerialize: serialize_fonoster_users_v1beta1_CreateUserCredentialsRequest,
    requestDeserialize: deserialize_fonoster_users_v1beta1_CreateUserCredentialsRequest,
    responseSerialize: serialize_fonoster_users_v1beta1_CreateUserCredentialsResponse,
    responseDeserialize: deserialize_fonoster_users_v1beta1_CreateUserCredentialsResponse,
  },
};

exports.UsersClient = grpc.makeGenericClientConstructor(UsersService);
