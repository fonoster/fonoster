// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Apps proto contains the artificats for application administration
// such as creation and deployment.
'use strict';
var grpc = require('@grpc/grpc-js');
var apps_pb = require('./apps_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');
var google_api_field_behavior_pb = require('./google/api/field_behavior_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var common_pb = require('./common_pb.js');

function serialize_fonoster_apps_v1beta1_App(arg) {
  if (!(arg instanceof apps_pb.App)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.App');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_App(buffer_arg) {
  return apps_pb.App.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_CreateAppRequest(arg) {
  if (!(arg instanceof apps_pb.CreateAppRequest)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.CreateAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_CreateAppRequest(buffer_arg) {
  return apps_pb.CreateAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_DeleteAppRequest(arg) {
  if (!(arg instanceof apps_pb.DeleteAppRequest)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.DeleteAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_DeleteAppRequest(buffer_arg) {
  return apps_pb.DeleteAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_GetAppRequest(arg) {
  if (!(arg instanceof apps_pb.GetAppRequest)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.GetAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_GetAppRequest(buffer_arg) {
  return apps_pb.GetAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_ListAppsRequest(arg) {
  if (!(arg instanceof apps_pb.ListAppsRequest)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.ListAppsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_ListAppsRequest(buffer_arg) {
  return apps_pb.ListAppsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_ListAppsResponse(arg) {
  if (!(arg instanceof apps_pb.ListAppsResponse)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.ListAppsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_ListAppsResponse(buffer_arg) {
  return apps_pb.ListAppsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_apps_v1beta1_UpdateAppRequest(arg) {
  if (!(arg instanceof apps_pb.UpdateAppRequest)) {
    throw new Error('Expected argument of type fonoster.apps.v1beta1.UpdateAppRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_apps_v1beta1_UpdateAppRequest(buffer_arg) {
  return apps_pb.UpdateAppRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_common_v1beta1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type fonoster.common.v1beta1.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_common_v1beta1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var AppsService = exports.AppsService = {
  // Shows a list of user applications
listApps: {
    path: '/fonoster.apps.v1beta1.Apps/ListApps',
    requestStream: false,
    responseStream: false,
    requestType: apps_pb.ListAppsRequest,
    responseType: apps_pb.ListAppsResponse,
    requestSerialize: serialize_fonoster_apps_v1beta1_ListAppsRequest,
    requestDeserialize: deserialize_fonoster_apps_v1beta1_ListAppsRequest,
    responseSerialize: serialize_fonoster_apps_v1beta1_ListAppsResponse,
    responseDeserialize: deserialize_fonoster_apps_v1beta1_ListAppsResponse,
  },
  // Creates a new App resource
createApp: {
    path: '/fonoster.apps.v1beta1.Apps/CreateApp',
    requestStream: false,
    responseStream: false,
    requestType: apps_pb.CreateAppRequest,
    responseType: apps_pb.App,
    requestSerialize: serialize_fonoster_apps_v1beta1_CreateAppRequest,
    requestDeserialize: deserialize_fonoster_apps_v1beta1_CreateAppRequest,
    responseSerialize: serialize_fonoster_apps_v1beta1_App,
    responseDeserialize: deserialize_fonoster_apps_v1beta1_App,
  },
  // Gets an application by reference
getApp: {
    path: '/fonoster.apps.v1beta1.Apps/GetApp',
    requestStream: false,
    responseStream: false,
    requestType: apps_pb.GetAppRequest,
    responseType: apps_pb.App,
    requestSerialize: serialize_fonoster_apps_v1beta1_GetAppRequest,
    requestDeserialize: deserialize_fonoster_apps_v1beta1_GetAppRequest,
    responseSerialize: serialize_fonoster_apps_v1beta1_App,
    responseDeserialize: deserialize_fonoster_apps_v1beta1_App,
  },
  // Change or update fields in a resource
updateApp: {
    path: '/fonoster.apps.v1beta1.Apps/UpdateApp',
    requestStream: false,
    responseStream: false,
    requestType: apps_pb.UpdateAppRequest,
    responseType: apps_pb.App,
    requestSerialize: serialize_fonoster_apps_v1beta1_UpdateAppRequest,
    requestDeserialize: deserialize_fonoster_apps_v1beta1_UpdateAppRequest,
    responseSerialize: serialize_fonoster_apps_v1beta1_App,
    responseDeserialize: deserialize_fonoster_apps_v1beta1_App,
  },
  // Peforms a hard delete of an application
deleteApp: {
    path: '/fonoster.apps.v1beta1.Apps/DeleteApp',
    requestStream: false,
    responseStream: false,
    requestType: apps_pb.DeleteAppRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_apps_v1beta1_DeleteAppRequest,
    requestDeserialize: deserialize_fonoster_apps_v1beta1_DeleteAppRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
};

exports.AppsClient = grpc.makeGenericClientConstructor(AppsService);
