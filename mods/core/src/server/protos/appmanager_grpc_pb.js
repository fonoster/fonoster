// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The AppMananger proto contains the artificats for apps administration
// such as creation and deployment.
"use strict";
var grpc = require("grpc");
var appmanager_pb = require("./appmanager_pb.js");
var common_pb = require("./common_pb.js");

function serialize_fonos_appmanager_v1alpha1_App(arg) {
  if (!(arg instanceof appmanager_pb.App)) {
    throw new Error("Expected argument of type fonos.appmanager.v1alpha1.App");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_App(buffer_arg) {
  return appmanager_pb.App.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_appmanager_v1alpha1_CreateAppRequest(arg) {
  if (!(arg instanceof appmanager_pb.CreateAppRequest)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.CreateAppRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_CreateAppRequest(buffer_arg) {
  return appmanager_pb.CreateAppRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_appmanager_v1alpha1_DeleteAppRequest(arg) {
  if (!(arg instanceof appmanager_pb.DeleteAppRequest)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.DeleteAppRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_DeleteAppRequest(buffer_arg) {
  return appmanager_pb.DeleteAppRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_appmanager_v1alpha1_GetAppRequest(arg) {
  if (!(arg instanceof appmanager_pb.GetAppRequest)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.GetAppRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_GetAppRequest(buffer_arg) {
  return appmanager_pb.GetAppRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_appmanager_v1alpha1_ListAppsRequest(arg) {
  if (!(arg instanceof appmanager_pb.ListAppsRequest)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.ListAppsRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_ListAppsRequest(buffer_arg) {
  return appmanager_pb.ListAppsRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_appmanager_v1alpha1_ListAppsResponse(arg) {
  if (!(arg instanceof appmanager_pb.ListAppsResponse)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.ListAppsResponse"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_ListAppsResponse(buffer_arg) {
  return appmanager_pb.ListAppsResponse.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_appmanager_v1alpha1_UpdateAppRequest(arg) {
  if (!(arg instanceof appmanager_pb.UpdateAppRequest)) {
    throw new Error(
      "Expected argument of type fonos.appmanager.v1alpha1.UpdateAppRequest"
    );
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_appmanager_v1alpha1_UpdateAppRequest(buffer_arg) {
  return appmanager_pb.UpdateAppRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  );
}

function serialize_fonos_common_v1alpha1_Empty(arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error("Expected argument of type fonos.common.v1alpha1.Empty");
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_common_v1alpha1_Empty(buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

var AppManagerService = (exports.AppManagerService = {
  // Lists user applications
  listApps: {
    path: "/fonos.appmanager.v1alpha1.AppManager/ListApps",
    requestStream: false,
    responseStream: false,
    requestType: appmanager_pb.ListAppsRequest,
    responseType: appmanager_pb.ListAppsResponse,
    requestSerialize: serialize_fonos_appmanager_v1alpha1_ListAppsRequest,
    requestDeserialize: deserialize_fonos_appmanager_v1alpha1_ListAppsRequest,
    responseSerialize: serialize_fonos_appmanager_v1alpha1_ListAppsResponse,
    responseDeserialize: deserialize_fonos_appmanager_v1alpha1_ListAppsResponse
  },
  // Gets app with the app-name
  getApp: {
    path: "/fonos.appmanager.v1alpha1.AppManager/GetApp",
    requestStream: false,
    responseStream: false,
    requestType: appmanager_pb.GetAppRequest,
    responseType: appmanager_pb.App,
    requestSerialize: serialize_fonos_appmanager_v1alpha1_GetAppRequest,
    requestDeserialize: deserialize_fonos_appmanager_v1alpha1_GetAppRequest,
    responseSerialize: serialize_fonos_appmanager_v1alpha1_App,
    responseDeserialize: deserialize_fonos_appmanager_v1alpha1_App
  },
  // Creates a new resource type app. Fails with ALREADY_EXISTS if
  // app-name is present in the system. The application creation, consist of:
  //
  //    1. Validing a Fonos App
  //    2. Zipping (or taring) the application
  //    3. Uploading the the file to a fonos endpoint
  //    4. Registering and activatng the application
  createApp: {
    path: "/fonos.appmanager.v1alpha1.AppManager/CreateApp",
    requestStream: false,
    responseStream: false,
    requestType: appmanager_pb.CreateAppRequest,
    responseType: appmanager_pb.App,
    requestSerialize: serialize_fonos_appmanager_v1alpha1_CreateAppRequest,
    requestDeserialize: deserialize_fonos_appmanager_v1alpha1_CreateAppRequest,
    responseSerialize: serialize_fonos_appmanager_v1alpha1_App,
    responseDeserialize: deserialize_fonos_appmanager_v1alpha1_App
  },
  // Updates an app resource
  updateApp: {
    path: "/fonos.appmanager.v1alpha1.AppManager/UpdateApp",
    requestStream: false,
    responseStream: false,
    requestType: appmanager_pb.UpdateAppRequest,
    responseType: appmanager_pb.App,
    requestSerialize: serialize_fonos_appmanager_v1alpha1_UpdateAppRequest,
    requestDeserialize: deserialize_fonos_appmanager_v1alpha1_UpdateAppRequest,
    responseSerialize: serialize_fonos_appmanager_v1alpha1_App,
    responseDeserialize: deserialize_fonos_appmanager_v1alpha1_App
  },
  // Peforms a hard delete of the app resource
  deleteApp: {
    path: "/fonos.appmanager.v1alpha1.AppManager/DeleteApp",
    requestStream: false,
    responseStream: false,
    requestType: appmanager_pb.DeleteAppRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonos_appmanager_v1alpha1_DeleteAppRequest,
    requestDeserialize: deserialize_fonos_appmanager_v1alpha1_DeleteAppRequest,
    responseSerialize: serialize_fonos_common_v1alpha1_Empty,
    responseDeserialize: deserialize_fonos_common_v1alpha1_Empty
  }
});

exports.AppManagerClient = grpc.makeGenericClientConstructor(AppManagerService);
