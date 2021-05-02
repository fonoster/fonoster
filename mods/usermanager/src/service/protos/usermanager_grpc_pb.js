// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The UserMananger proto contains the artificats for Users administration
// such as creation and deployment.
"use strict";
var grpc = require("grpc");
var usermanager_pb = require("./usermanager_pb.js");
var common_pb = require("./common_pb.js");

function serialize_fonos_common_v1alpha1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error("Expected argument of type fonos.common.v1alpha1.Empty");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_common_v1alpha1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_usermanager_v1alpha1_CreateUserRequest(arg) {
  if (!(arg instanceof usermanager_pb.CreateUserRequest)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.CreateUserRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_CreateUserRequest(buffer_arg) {
  return usermanager_pb.CreateUserRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_DeleteUserRequest(arg) {
  if (!(arg instanceof usermanager_pb.DeleteUserRequest)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.DeleteUserRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_DeleteUserRequest(buffer_arg) {
  return usermanager_pb.DeleteUserRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_GetUserRequest(arg) {
  if (!(arg instanceof usermanager_pb.GetUserRequest)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.GetUserRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_GetUserRequest(buffer_arg) {
  return usermanager_pb.GetUserRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_ListUsersRequest(arg) {
  if (!(arg instanceof usermanager_pb.ListUsersRequest)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.ListUsersRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_ListUsersRequest(buffer_arg) {
  return usermanager_pb.ListUsersRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_ListUsersResponse(arg) {
  if (!(arg instanceof usermanager_pb.ListUsersResponse)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.ListUsersResponse"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_ListUsersResponse(buffer_arg) {
  return usermanager_pb.ListUsersResponse.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_UpdateUserRequest(arg) {
  if (!(arg instanceof usermanager_pb.UpdateUserRequest)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.UpdateUserRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_UpdateUserRequest(buffer_arg) {
  return usermanager_pb.UpdateUserRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_usermanager_v1alpha1_User(arg) {
  if (!(arg instanceof usermanager_pb.User)) {
    throw new Error(
      "Expected argument of type fonos.usermanager.v1alpha1.User"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_usermanager_v1alpha1_User(buffer_arg) {
  return usermanager_pb.User.deserializeBinary(new Uint8Array(buffer_arg));
}

var UserManagerService = (exports.UserManagerService = {
  // Lists user Userlications
  listUsers: {
    path: "/fonos.usermanager.v1alpha1.UserManager/ListUsers",
    requestStream: false,
    responseStream: false,
    requestType: usermanager_pb.ListUsersRequest,
    responseType: usermanager_pb.ListUsersResponse,
    requestSerialize: serialize_fonos_usermanager_v1alpha1_ListUsersRequest,
    requestDeserialize: deserialize_fonos_usermanager_v1alpha1_ListUsersRequest,
    responseSerialize: serialize_fonos_usermanager_v1alpha1_ListUsersResponse,
    responseDeserialize: deserialize_fonos_usermanager_v1alpha1_ListUsersResponse
  },
  // Gets User with the User-name
  getUser: {
    path: "/fonos.usermanager.v1alpha1.UserManager/GetUser",
    requestStream: false,
    responseStream: false,
    requestType: usermanager_pb.GetUserRequest,
    responseType: usermanager_pb.User,
    requestSerialize: serialize_fonos_usermanager_v1alpha1_GetUserRequest,
    requestDeserialize: deserialize_fonos_usermanager_v1alpha1_GetUserRequest,
    responseSerialize: serialize_fonos_usermanager_v1alpha1_User,
    responseDeserialize: deserialize_fonos_usermanager_v1alpha1_User
  },
  createUser: {
    path: "/fonos.usermanager.v1alpha1.UserManager/CreateUser",
    requestStream: false,
    responseStream: false,
    requestType: usermanager_pb.CreateUserRequest,
    responseType: usermanager_pb.User,
    requestSerialize: serialize_fonos_usermanager_v1alpha1_CreateUserRequest,
    requestDeserialize: deserialize_fonos_usermanager_v1alpha1_CreateUserRequest,
    responseSerialize: serialize_fonos_usermanager_v1alpha1_User,
    responseDeserialize: deserialize_fonos_usermanager_v1alpha1_User
  },
  // Updates an User resource
  updateUser: {
    path: "/fonos.usermanager.v1alpha1.UserManager/UpdateUser",
    requestStream: false,
    responseStream: false,
    requestType: usermanager_pb.UpdateUserRequest,
    responseType: usermanager_pb.User,
    requestSerialize: serialize_fonos_usermanager_v1alpha1_UpdateUserRequest,
    requestDeserialize: deserialize_fonos_usermanager_v1alpha1_UpdateUserRequest,
    responseSerialize: serialize_fonos_usermanager_v1alpha1_User,
    responseDeserialize: deserialize_fonos_usermanager_v1alpha1_User
  },
  // Peforms a hard delete of the User resource
  deleteUser: {
    path: "/fonos.usermanager.v1alpha1.UserManager/DeleteUser",
    requestStream: false,
    responseStream: false,
    requestType: usermanager_pb.DeleteUserRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_usermanager_v1alpha1_DeleteUserRequest,
    requestDeserialize: deserialize_fonos_usermanager_v1alpha1_DeleteUserRequest,
    responseSerialize: serialize_fonos_common_v1alpha1_Empty,
    responseDeserialize: deserialize_fonos_common_v1alpha1_Empty
  }
});

exports.UserManagerClient = grpc.makeGenericClientConstructor(
  UserManagerService
);
