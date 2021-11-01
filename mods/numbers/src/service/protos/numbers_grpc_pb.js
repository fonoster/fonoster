// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Numbers proto contains the artificats for the administration
// of Numbers.
'use strict';
var grpc = require('@grpc/grpc-js');
var numbers_pb = require('./numbers_pb.js');
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

function serialize_fonoster_numbers_v1beta1_CreateNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.CreateNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.CreateNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_CreateNumberRequest(buffer_arg) {
  return numbers_pb.CreateNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_DeleteNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.DeleteNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.DeleteNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_DeleteNumberRequest(buffer_arg) {
  return numbers_pb.DeleteNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_GetIngressInfoRequest(arg) {
  if (!(arg instanceof numbers_pb.GetIngressInfoRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.GetIngressInfoRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_GetIngressInfoRequest(buffer_arg) {
  return numbers_pb.GetIngressInfoRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_GetNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.GetNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.GetNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_GetNumberRequest(buffer_arg) {
  return numbers_pb.GetNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_IngressInfo(arg) {
  if (!(arg instanceof numbers_pb.IngressInfo)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.IngressInfo');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_IngressInfo(buffer_arg) {
  return numbers_pb.IngressInfo.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_ListNumbersRequest(arg) {
  if (!(arg instanceof numbers_pb.ListNumbersRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.ListNumbersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_ListNumbersRequest(buffer_arg) {
  return numbers_pb.ListNumbersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_ListNumbersResponse(arg) {
  if (!(arg instanceof numbers_pb.ListNumbersResponse)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.ListNumbersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_ListNumbersResponse(buffer_arg) {
  return numbers_pb.ListNumbersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_Number(arg) {
  if (!(arg instanceof numbers_pb.Number)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.Number');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_Number(buffer_arg) {
  return numbers_pb.Number.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_numbers_v1beta1_UpdateNumberRequest(arg) {
  if (!(arg instanceof numbers_pb.UpdateNumberRequest)) {
    throw new Error('Expected argument of type fonoster.numbers.v1beta1.UpdateNumberRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_numbers_v1beta1_UpdateNumberRequest(buffer_arg) {
  return numbers_pb.UpdateNumberRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var NumbersService = exports.NumbersService = {
  // Lists Numbers from the SIP Proxy subsystem
listNumbers: {
    path: '/fonoster.numbers.v1beta1.Numbers/ListNumbers',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.ListNumbersRequest,
    responseType: numbers_pb.ListNumbersResponse,
    requestSerialize: serialize_fonoster_numbers_v1beta1_ListNumbersRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_ListNumbersRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta1_ListNumbersResponse,
    responseDeserialize: deserialize_fonoster_numbers_v1beta1_ListNumbersResponse,
  },
  // Creates a new Number resource
createNumber: {
    path: '/fonoster.numbers.v1beta1.Numbers/CreateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.CreateNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_fonoster_numbers_v1beta1_CreateNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_CreateNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta1_Number,
    responseDeserialize: deserialize_fonoster_numbers_v1beta1_Number,
  },
  // Gets the ingess information for a given e164 number
getIngressInfo: {
    path: '/fonoster.numbers.v1beta1.Numbers/GetIngressInfo',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.GetIngressInfoRequest,
    responseType: numbers_pb.IngressInfo,
    requestSerialize: serialize_fonoster_numbers_v1beta1_GetIngressInfoRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_GetIngressInfoRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta1_IngressInfo,
    responseDeserialize: deserialize_fonoster_numbers_v1beta1_IngressInfo,
  },
  // Gets Number using its reference
getNumber: {
    path: '/fonoster.numbers.v1beta1.Numbers/GetNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.GetNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_fonoster_numbers_v1beta1_GetNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_GetNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta1_Number,
    responseDeserialize: deserialize_fonoster_numbers_v1beta1_Number,
  },
  // Change or update fields in a resource
updateNumber: {
    path: '/fonoster.numbers.v1beta1.Numbers/UpdateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.UpdateNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_fonoster_numbers_v1beta1_UpdateNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_UpdateNumberRequest,
    responseSerialize: serialize_fonoster_numbers_v1beta1_Number,
    responseDeserialize: deserialize_fonoster_numbers_v1beta1_Number,
  },
  // Hard delete of a Number resource
deleteNumber: {
    path: '/fonoster.numbers.v1beta1.Numbers/DeleteNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.DeleteNumberRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_numbers_v1beta1_DeleteNumberRequest,
    requestDeserialize: deserialize_fonoster_numbers_v1beta1_DeleteNumberRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
};

exports.NumbersClient = grpc.makeGenericClientConstructor(NumbersService);
