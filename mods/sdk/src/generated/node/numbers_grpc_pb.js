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
var numbers_pb = require('./numbers_pb.js');

function serialize_fonoster_numbers_v1beta2_CreateNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.CreateNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.CreateNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_CreateNumberRequest(buffer_arg) {
  return numbers_pb.CreateNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_CreateNumberResponse(arg) {
  if (!(arg instanceof numbers_pb.CreateNumberResponse)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.CreateNumberResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_CreateNumberResponse(buffer_arg) {
  return numbers_pb.CreateNumberResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_DeleteNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.DeleteNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.DeleteNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_DeleteNumberRequest(buffer_arg) {
  return numbers_pb.DeleteNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_DeleteNumberResponse(arg) {
  if (!(arg instanceof numbers_pb.DeleteNumberResponse)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.DeleteNumberResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_DeleteNumberResponse(buffer_arg) {
  return numbers_pb.DeleteNumberResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_GetNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.GetNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.GetNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_GetNumberRequest(buffer_arg) {
  return numbers_pb.GetNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_ListNumbersRequest(arg) {
  if (!(arg instanceof numbers_pb.ListNumbersRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.ListNumbersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_ListNumbersRequest(buffer_arg) {
  return numbers_pb.ListNumbersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_ListNumbersResponse(arg) {
  if (!(arg instanceof numbers_pb.ListNumbersResponse)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.ListNumbersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_ListNumbersResponse(buffer_arg) {
  return numbers_pb.ListNumbersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_Number(arg) {
  if (!(arg instanceof numbers_pb.Number)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.Number');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_Number(buffer_arg) {
  return numbers_pb.Number.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_UpdateNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.UpdateNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.UpdateNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_UpdateNumberRequest(buffer_arg) {
  return numbers_pb.UpdateNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta2_UpdateNumberResponse(arg) {
  if (!(arg instanceof numbers_pb.UpdateNumberResponse)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta2.UpdateNumberResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta2_UpdateNumberResponse(buffer_arg) {
  return numbers_pb.UpdateNumberResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


// The Numbers service definition
var NumbersService = exports.NumbersService = {
  // Create a new Number
createNumber: {
    path: '/fonoster.numbers.v1beta2.Numbers/CreateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.CreateNumberRequest,
    responseType: numbers_pb.CreateNumberResponse,
    requestSerialize: serialize_fonoster_numbers_v1beta2_CreateNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta2_CreateNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta2_CreateNumberResponse,
    responseDeserialize: deserialize_fonoster_numbers_v1beta2_CreateNumberResponse,
  },
  // Update an existing Number
updateNumber: {
    path: '/fonoster.numbers.v1beta2.Numbers/UpdateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.UpdateNumberRequest,
    responseType: numbers_pb.UpdateNumberResponse,
    requestSerialize: serialize_fonoster_numbers_v1beta2_UpdateNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta2_UpdateNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta2_UpdateNumberResponse,
    responseDeserialize: deserialize_fonoster_numbers_v1beta2_UpdateNumberResponse,
  },
  // Get an existing Number
getNumber: {
    path: '/fonoster.numbers.v1beta2.Numbers/GetNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.GetNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_fonoster_numbers_v1beta2_GetNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta2_GetNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta2_Number,
    responseDeserialize: deserialize_fonoster_numbers_v1beta2_Number,
  },
  // Delete an existing Number
deleteNumber: {
    path: '/fonoster.numbers.v1beta2.Numbers/DeleteNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.DeleteNumberRequest,
    responseType: numbers_pb.DeleteNumberResponse,
    requestSerialize: serialize_fonoster_numbers_v1beta2_DeleteNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta2_DeleteNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta2_DeleteNumberResponse,
    responseDeserialize: deserialize_fonoster_numbers_v1beta2_DeleteNumberResponse,
  },
  // List Numbers
listNumbers: {
    path: '/fonoster.numbers.v1beta2.Numbers/ListNumbers',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.ListNumbersRequest,
    responseType: numbers_pb.ListNumbersResponse,
    requestSerialize: serialize_fonoster_numbers_v1beta2_ListNumbersRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta2_ListNumbersRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta2_ListNumbersResponse,
    responseDeserialize: deserialize_fonoster_numbers_v1beta2_ListNumbersResponse,
  },
};

exports.NumbersClient = grpc.makeGenericClientConstructor(NumbersService, 'Numbers');
