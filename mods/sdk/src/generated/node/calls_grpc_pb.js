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
var calls_pb = require('./calls_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_fonoster_calls_v1beta2_CallDetailRecord(arg) {
  if (!(arg instanceof calls_pb.CallDetailRecord)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.CallDetailRecord');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_CallDetailRecord(buffer_arg) {
  return calls_pb.CallDetailRecord.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_CreateCallRequest(arg) {
  if (!(arg instanceof calls_pb.CreateCallRequest)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.CreateCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_CreateCallRequest(buffer_arg) {
  return calls_pb.CreateCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_CreateCallResponse(arg) {
  if (!(arg instanceof calls_pb.CreateCallResponse)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.CreateCallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_CreateCallResponse(buffer_arg) {
  return calls_pb.CreateCallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_GetCallRequest(arg) {
  if (!(arg instanceof calls_pb.GetCallRequest)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.GetCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_GetCallRequest(buffer_arg) {
  return calls_pb.GetCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_ListCallsRequest(arg) {
  if (!(arg instanceof calls_pb.ListCallsRequest)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.ListCallsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_ListCallsRequest(buffer_arg) {
  return calls_pb.ListCallsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_ListCallsResponse(arg) {
  if (!(arg instanceof calls_pb.ListCallsResponse)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.ListCallsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_ListCallsResponse(buffer_arg) {
  return calls_pb.ListCallsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_TrackCallRequest(arg) {
  if (!(arg instanceof calls_pb.TrackCallRequest)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.TrackCallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_TrackCallRequest(buffer_arg) {
  return calls_pb.TrackCallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_calls_v1beta2_TrackCallResponse(arg) {
  if (!(arg instanceof calls_pb.TrackCallResponse)) {
    throw new Error('Expected argument of type fonoster.calls.v1beta2.TrackCallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_calls_v1beta2_TrackCallResponse(buffer_arg) {
  return calls_pb.TrackCallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// Calls service definition
var CallsService = exports.CallsService = {
  // Call a number and returns the call status
createCall: {
    path: '/fonoster.calls.v1beta2.Calls/CreateCall',
    requestStream: false,
    responseStream: false,
    requestType: calls_pb.CreateCallRequest,
    responseType: calls_pb.CreateCallResponse,
    requestSerialize: serialize_fonoster_calls_v1beta2_CreateCallRequest,
    requestDeserialize: deserialize_fonoster_calls_v1beta2_CreateCallRequest,
    responseSerialize: serialize_fonoster_calls_v1beta2_CreateCallResponse,
    responseDeserialize: deserialize_fonoster_calls_v1beta2_CreateCallResponse,
  },
  // Get a list of Call Detail Records
listCalls: {
    path: '/fonoster.calls.v1beta2.Calls/ListCalls',
    requestStream: false,
    responseStream: false,
    requestType: calls_pb.ListCallsRequest,
    responseType: calls_pb.ListCallsResponse,
    requestSerialize: serialize_fonoster_calls_v1beta2_ListCallsRequest,
    requestDeserialize: deserialize_fonoster_calls_v1beta2_ListCallsRequest,
    responseSerialize: serialize_fonoster_calls_v1beta2_ListCallsResponse,
    responseDeserialize: deserialize_fonoster_calls_v1beta2_ListCallsResponse,
  },
  // Get a Call Detail Record
getCall: {
    path: '/fonoster.calls.v1beta2.Calls/GetCall',
    requestStream: false,
    responseStream: false,
    requestType: calls_pb.GetCallRequest,
    responseType: calls_pb.CallDetailRecord,
    requestSerialize: serialize_fonoster_calls_v1beta2_GetCallRequest,
    requestDeserialize: deserialize_fonoster_calls_v1beta2_GetCallRequest,
    responseSerialize: serialize_fonoster_calls_v1beta2_CallDetailRecord,
    responseDeserialize: deserialize_fonoster_calls_v1beta2_CallDetailRecord,
  },
  // Stream call status
trackCall: {
    path: '/fonoster.calls.v1beta2.Calls/TrackCall',
    requestStream: false,
    responseStream: true,
    requestType: calls_pb.TrackCallRequest,
    responseType: calls_pb.TrackCallResponse,
    requestSerialize: serialize_fonoster_calls_v1beta2_TrackCallRequest,
    requestDeserialize: deserialize_fonoster_calls_v1beta2_TrackCallRequest,
    responseSerialize: serialize_fonoster_calls_v1beta2_TrackCallResponse,
    responseDeserialize: deserialize_fonoster_calls_v1beta2_TrackCallResponse,
  },
};

exports.CallsClient = grpc.makeGenericClientConstructor(CallsService, 'Calls');
