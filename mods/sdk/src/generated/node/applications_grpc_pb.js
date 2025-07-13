// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
// http://github.com/fonoster/fonoster
//
// This file is part of Fonoster
//
// Licensed under the MIT License (the "License");
// you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
//
//    https://opensource.org/licenses/MIT
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';
var grpc = require('@grpc/grpc-js');
var applications_pb = require('./applications_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_fonoster_applications_v1beta2_Application(arg) {
  if (!(arg instanceof applications_pb.Application)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.Application');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_Application(buffer_arg) {
  return applications_pb.Application.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_CreateApplicationRequest(arg) {
  if (!(arg instanceof applications_pb.CreateApplicationRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.CreateApplicationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_CreateApplicationRequest(buffer_arg) {
  return applications_pb.CreateApplicationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_CreateApplicationResponse(arg) {
  if (!(arg instanceof applications_pb.CreateApplicationResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.CreateApplicationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_CreateApplicationResponse(buffer_arg) {
  return applications_pb.CreateApplicationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_DeleteApplicationRequest(arg) {
  if (!(arg instanceof applications_pb.DeleteApplicationRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.DeleteApplicationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_DeleteApplicationRequest(buffer_arg) {
  return applications_pb.DeleteApplicationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_DeleteApplicationResponse(arg) {
  if (!(arg instanceof applications_pb.DeleteApplicationResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.DeleteApplicationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_DeleteApplicationResponse(buffer_arg) {
  return applications_pb.DeleteApplicationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_EvaluateIntelligenceRequest(arg) {
  if (!(arg instanceof applications_pb.EvaluateIntelligenceRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.EvaluateIntelligenceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_EvaluateIntelligenceRequest(buffer_arg) {
  return applications_pb.EvaluateIntelligenceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_EvaluateIntelligenceResponse(arg) {
  if (!(arg instanceof applications_pb.EvaluateIntelligenceResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.EvaluateIntelligenceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_EvaluateIntelligenceResponse(buffer_arg) {
  return applications_pb.EvaluateIntelligenceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_GetApplicationRequest(arg) {
  if (!(arg instanceof applications_pb.GetApplicationRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.GetApplicationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_GetApplicationRequest(buffer_arg) {
  return applications_pb.GetApplicationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_ListApplicationsRequest(arg) {
  if (!(arg instanceof applications_pb.ListApplicationsRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.ListApplicationsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_ListApplicationsRequest(buffer_arg) {
  return applications_pb.ListApplicationsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_ListApplicationsResponse(arg) {
  if (!(arg instanceof applications_pb.ListApplicationsResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.ListApplicationsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_ListApplicationsResponse(buffer_arg) {
  return applications_pb.ListApplicationsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_TestTokenResponse(arg) {
  if (!(arg instanceof applications_pb.TestTokenResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.TestTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_TestTokenResponse(buffer_arg) {
  return applications_pb.TestTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_UpdateApplicationRequest(arg) {
  if (!(arg instanceof applications_pb.UpdateApplicationRequest)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.UpdateApplicationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_UpdateApplicationRequest(buffer_arg) {
  return applications_pb.UpdateApplicationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_applications_v1beta2_UpdateApplicationResponse(arg) {
  if (!(arg instanceof applications_pb.UpdateApplicationResponse)) {
    throw new Error('Expected argument of type fonoster.applications.v1beta2.UpdateApplicationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_applications_v1beta2_UpdateApplicationResponse(buffer_arg) {
  return applications_pb.UpdateApplicationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


// Applications service definition
var ApplicationsService = exports.ApplicationsService = {
  // Create a new application
createApplication: {
    path: '/fonoster.applications.v1beta2.Applications/CreateApplication',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.CreateApplicationRequest,
    responseType: applications_pb.CreateApplicationResponse,
    requestSerialize: serialize_fonoster_applications_v1beta2_CreateApplicationRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_CreateApplicationRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_CreateApplicationResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_CreateApplicationResponse,
  },
  // Get an application
getApplication: {
    path: '/fonoster.applications.v1beta2.Applications/GetApplication',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.GetApplicationRequest,
    responseType: applications_pb.Application,
    requestSerialize: serialize_fonoster_applications_v1beta2_GetApplicationRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_GetApplicationRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_Application,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_Application,
  },
  // List applications
listApplications: {
    path: '/fonoster.applications.v1beta2.Applications/ListApplications',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.ListApplicationsRequest,
    responseType: applications_pb.ListApplicationsResponse,
    requestSerialize: serialize_fonoster_applications_v1beta2_ListApplicationsRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_ListApplicationsRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_ListApplicationsResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_ListApplicationsResponse,
  },
  // Update an application
updateApplication: {
    path: '/fonoster.applications.v1beta2.Applications/UpdateApplication',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.UpdateApplicationRequest,
    responseType: applications_pb.UpdateApplicationResponse,
    requestSerialize: serialize_fonoster_applications_v1beta2_UpdateApplicationRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_UpdateApplicationRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_UpdateApplicationResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_UpdateApplicationResponse,
  },
  // Delete an application
deleteApplication: {
    path: '/fonoster.applications.v1beta2.Applications/DeleteApplication',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.DeleteApplicationRequest,
    responseType: applications_pb.DeleteApplicationResponse,
    requestSerialize: serialize_fonoster_applications_v1beta2_DeleteApplicationRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_DeleteApplicationRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_DeleteApplicationResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_DeleteApplicationResponse,
  },
  // Evaluate the intellgence for an Autopilot application
evaluateIntelligence: {
    path: '/fonoster.applications.v1beta2.Applications/EvaluateIntelligence',
    requestStream: false,
    responseStream: false,
    requestType: applications_pb.EvaluateIntelligenceRequest,
    responseType: applications_pb.EvaluateIntelligenceResponse,
    requestSerialize: serialize_fonoster_applications_v1beta2_EvaluateIntelligenceRequest,
    requestDeserialize: deserialize_fonoster_applications_v1beta2_EvaluateIntelligenceRequest,
    responseSerialize: serialize_fonoster_applications_v1beta2_EvaluateIntelligenceResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_EvaluateIntelligenceResponse,
  },
  // Create an Ephemeral Agent to perform test calls to an application
createTestToken: {
    path: '/fonoster.applications.v1beta2.Applications/CreateTestToken',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: applications_pb.TestTokenResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fonoster_applications_v1beta2_TestTokenResponse,
    responseDeserialize: deserialize_fonoster_applications_v1beta2_TestTokenResponse,
  },
};

exports.ApplicationsClient = grpc.makeGenericClientConstructor(ApplicationsService, 'Applications');
