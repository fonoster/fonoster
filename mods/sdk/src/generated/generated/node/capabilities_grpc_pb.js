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
var capabilities_pb = require('./capabilities_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_fonoster_capabilities_v1beta2_GetCapabilitiesResponse(arg) {
  if (!(arg instanceof capabilities_pb.GetCapabilitiesResponse)) {
    throw new Error('Expected argument of type fonoster.capabilities.v1beta2.GetCapabilitiesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_capabilities_v1beta2_GetCapabilitiesResponse(buffer_arg) {
  return capabilities_pb.GetCapabilitiesResponse.deserializeBinary(new Uint8Array(buffer_arg));
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


// What this deployment supports, from fonoster.yaml. Public (no credentials
// needed) so sign-in screens can render from it; it never returns secrets.
var CapabilitiesService = exports.CapabilitiesService = {
  // Gets the deployment's capabilities
getCapabilities: {
    path: '/fonoster.capabilities.v1beta2.Capabilities/GetCapabilities',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: capabilities_pb.GetCapabilitiesResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fonoster_capabilities_v1beta2_GetCapabilitiesResponse,
    responseDeserialize: deserialize_fonoster_capabilities_v1beta2_GetCapabilitiesResponse,
  },
};

exports.CapabilitiesClient = grpc.makeGenericClientConstructor(CapabilitiesService, 'Capabilities');
