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
var usage_pb = require('./usage_pb.js');

function serialize_fonoster_usage_v1beta2_GetUsageRequest(arg) {
  if (!(arg instanceof usage_pb.GetUsageRequest)) {
    throw new Error('Expected argument of type fonoster.usage.v1beta2.GetUsageRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_usage_v1beta2_GetUsageRequest(buffer_arg) {
  return usage_pb.GetUsageRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_usage_v1beta2_GetUsageResponse(arg) {
  if (!(arg instanceof usage_pb.GetUsageResponse)) {
    throw new Error('Expected argument of type fonoster.usage.v1beta2.GetUsageResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_usage_v1beta2_GetUsageResponse(buffer_arg) {
  return usage_pb.GetUsageResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// What the workspace consumed: quantities only, never money (usage-metering spec).
var UsageService = exports.UsageService = {
  // Gets usage totals for a range of days, grouped as requested
getUsage: {
    path: '/fonoster.usage.v1beta2.Usage/GetUsage',
    requestStream: false,
    responseStream: false,
    requestType: usage_pb.GetUsageRequest,
    responseType: usage_pb.GetUsageResponse,
    requestSerialize: serialize_fonoster_usage_v1beta2_GetUsageRequest,
    requestDeserialize: deserialize_fonoster_usage_v1beta2_GetUsageRequest,
    responseSerialize: serialize_fonoster_usage_v1beta2_GetUsageResponse,
    responseDeserialize: deserialize_fonoster_usage_v1beta2_GetUsageResponse,
  },
};

exports.UsageClient = grpc.makeGenericClientConstructor(UsageService, 'Usage');
