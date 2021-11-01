// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Funcs proto contains the artificats for function administration
// such as creation and deployment.
'use strict';
var grpc = require('@grpc/grpc-js');
var funcs_pb = require('./funcs_pb.js');
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

function serialize_fonoster_funcs_v1beta1_CreateRegistryTokenRequest(arg) {
  if (!(arg instanceof funcs_pb.CreateRegistryTokenRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.CreateRegistryTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_CreateRegistryTokenRequest(buffer_arg) {
  return funcs_pb.CreateRegistryTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_CreateRegistryTokenResponse(arg) {
  if (!(arg instanceof funcs_pb.CreateRegistryTokenResponse)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.CreateRegistryTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_CreateRegistryTokenResponse(buffer_arg) {
  return funcs_pb.CreateRegistryTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_DeleteFuncRequest(arg) {
  if (!(arg instanceof funcs_pb.DeleteFuncRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.DeleteFuncRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_DeleteFuncRequest(buffer_arg) {
  return funcs_pb.DeleteFuncRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_DeployFuncRequest(arg) {
  if (!(arg instanceof funcs_pb.DeployFuncRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.DeployFuncRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_DeployFuncRequest(buffer_arg) {
  return funcs_pb.DeployFuncRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_DeployStream(arg) {
  if (!(arg instanceof funcs_pb.DeployStream)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.DeployStream');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_DeployStream(buffer_arg) {
  return funcs_pb.DeployStream.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_Func(arg) {
  if (!(arg instanceof funcs_pb.Func)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.Func');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_Func(buffer_arg) {
  return funcs_pb.Func.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_FuncLog(arg) {
  if (!(arg instanceof funcs_pb.FuncLog)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.FuncLog');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_FuncLog(buffer_arg) {
  return funcs_pb.FuncLog.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_GetFuncLogsRequest(arg) {
  if (!(arg instanceof funcs_pb.GetFuncLogsRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.GetFuncLogsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_GetFuncLogsRequest(buffer_arg) {
  return funcs_pb.GetFuncLogsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_GetFuncRequest(arg) {
  if (!(arg instanceof funcs_pb.GetFuncRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.GetFuncRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_GetFuncRequest(buffer_arg) {
  return funcs_pb.GetFuncRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_ListFuncsRequest(arg) {
  if (!(arg instanceof funcs_pb.ListFuncsRequest)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.ListFuncsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_ListFuncsRequest(buffer_arg) {
  return funcs_pb.ListFuncsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_funcs_v1beta1_ListFuncsResponse(arg) {
  if (!(arg instanceof funcs_pb.ListFuncsResponse)) {
    throw new Error('Expected argument of type fonoster.funcs.v1beta1.ListFuncsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_funcs_v1beta1_ListFuncsResponse(buffer_arg) {
  return funcs_pb.ListFuncsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var FuncsService = exports.FuncsService = {
  // Shows a list of user functions
listFuncs: {
    path: '/fonoster.funcs.v1beta1.Funcs/ListFuncs',
    requestStream: false,
    responseStream: false,
    requestType: funcs_pb.ListFuncsRequest,
    responseType: funcs_pb.ListFuncsResponse,
    requestSerialize: serialize_fonoster_funcs_v1beta1_ListFuncsRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_ListFuncsRequest,
    responseSerialize: serialize_fonoster_funcs_v1beta1_ListFuncsResponse,
    responseDeserialize: deserialize_fonoster_funcs_v1beta1_ListFuncsResponse,
  },
  // Gets a function by name
getFunc: {
    path: '/fonoster.funcs.v1beta1.Funcs/GetFunc',
    requestStream: false,
    responseStream: false,
    requestType: funcs_pb.GetFuncRequest,
    responseType: funcs_pb.Func,
    requestSerialize: serialize_fonoster_funcs_v1beta1_GetFuncRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_GetFuncRequest,
    responseSerialize: serialize_fonoster_funcs_v1beta1_Func,
    responseDeserialize: deserialize_fonoster_funcs_v1beta1_Func,
  },
  // Orders the functions subsystem to download and deploy a function
deployFunc: {
    path: '/fonoster.funcs.v1beta1.Funcs/DeployFunc',
    requestStream: false,
    responseStream: true,
    requestType: funcs_pb.DeployFuncRequest,
    responseType: funcs_pb.DeployStream,
    requestSerialize: serialize_fonoster_funcs_v1beta1_DeployFuncRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_DeployFuncRequest,
    responseSerialize: serialize_fonoster_funcs_v1beta1_DeployStream,
    responseDeserialize: deserialize_fonoster_funcs_v1beta1_DeployStream,
  },
  // Peforms a hard delete of the function
deleteFunc: {
    path: '/fonoster.funcs.v1beta1.Funcs/DeleteFunc',
    requestStream: false,
    responseStream: false,
    requestType: funcs_pb.DeleteFuncRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_funcs_v1beta1_DeleteFuncRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_DeleteFuncRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
  // Gets a stream of logs
getFuncLogs: {
    path: '/fonoster.funcs.v1beta1.Funcs/GetFuncLogs',
    requestStream: false,
    responseStream: true,
    requestType: funcs_pb.GetFuncLogsRequest,
    responseType: funcs_pb.FuncLog,
    requestSerialize: serialize_fonoster_funcs_v1beta1_GetFuncLogsRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_GetFuncLogsRequest,
    responseSerialize: serialize_fonoster_funcs_v1beta1_FuncLog,
    responseDeserialize: deserialize_fonoster_funcs_v1beta1_FuncLog,
  },
  // Creates a one time scoped token for access to the registry 
createRegistryToken: {
    path: '/fonoster.funcs.v1beta1.Funcs/CreateRegistryToken',
    requestStream: false,
    responseStream: false,
    requestType: funcs_pb.CreateRegistryTokenRequest,
    responseType: funcs_pb.CreateRegistryTokenResponse,
    requestSerialize: serialize_fonoster_funcs_v1beta1_CreateRegistryTokenRequest,
    requestDeserialize: deserialize_fonoster_funcs_v1beta1_CreateRegistryTokenRequest,
    responseSerialize: serialize_fonoster_funcs_v1beta1_CreateRegistryTokenResponse,
    responseDeserialize: deserialize_fonoster_funcs_v1beta1_CreateRegistryTokenResponse,
  },
};

exports.FuncsClient = grpc.makeGenericClientConstructor(FuncsService);
