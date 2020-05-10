// GENERATED CODE -- DO NOT EDIT!
// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Numbers proto contains the artificats for the administration
// of Numbers.
'use strict'
var grpc = require('grpc')
var numbers_pb = require('./numbers_pb.js')
var common_pb = require('./common_pb.js')
var appmanager_pb = require('./appmanager_pb.js')
function serialize_yaps_appmanager_v1alpha1_App (arg) {
  if (!(arg instanceof appmanager_pb.App)) {
    throw new Error('Expected argument of type yaps.appmanager.v1alpha1.App')
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_appmanager_v1alpha1_App (buffer_arg) {
  return appmanager_pb.App.deserializeBinary(new Uint8Array(buffer_arg))
}
function serialize_yaps_common_v1alpha1_Empty (arg) {
  if (!(arg instanceof common_pb.Empty)) {
    throw new Error('Expected argument of type yaps.common.v1alpha1.Empty')
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_common_v1alpha1_Empty (buffer_arg) {
  return common_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg))
}
function serialize_yaps_numbers_v1alpha1_CreateNumberRequest (arg) {
  if (!(arg instanceof numbers_pb.CreateNumberRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.CreateNumberRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_CreateNumberRequest (buffer_arg) {
  return numbers_pb.CreateNumberRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_DeleteNumberRequest (arg) {
  if (!(arg instanceof numbers_pb.DeleteNumberRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.DeleteNumberRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_DeleteNumberRequest (buffer_arg) {
  return numbers_pb.DeleteNumberRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_GetIngressAppRequest (arg) {
  if (!(arg instanceof numbers_pb.GetIngressAppRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.GetIngressAppRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_GetIngressAppRequest (buffer_arg) {
  return numbers_pb.GetIngressAppRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_GetNumberRequest (arg) {
  if (!(arg instanceof numbers_pb.GetNumberRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.GetNumberRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_GetNumberRequest (buffer_arg) {
  return numbers_pb.GetNumberRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_ListNumbersRequest (arg) {
  if (!(arg instanceof numbers_pb.ListNumbersRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.ListNumbersRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_ListNumbersRequest (buffer_arg) {
  return numbers_pb.ListNumbersRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_ListNumbersResponse (arg) {
  if (!(arg instanceof numbers_pb.ListNumbersResponse)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.ListNumbersResponse'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_ListNumbersResponse (buffer_arg) {
  return numbers_pb.ListNumbersResponse.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
function serialize_yaps_numbers_v1alpha1_Number (arg) {
  if (!(arg instanceof numbers_pb.Number)) {
    throw new Error('Expected argument of type yaps.numbers.v1alpha1.Number')
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_Number (buffer_arg) {
  return numbers_pb.Number.deserializeBinary(new Uint8Array(buffer_arg))
}
function serialize_yaps_numbers_v1alpha1_UpdateNumberRequest (arg) {
  if (!(arg instanceof numbers_pb.UpdateNumberRequest)) {
    throw new Error(
      'Expected argument of type yaps.numbers.v1alpha1.UpdateNumberRequest'
    )
  }
  return Buffer.from(arg.serializeBinary())
}
function deserialize_yaps_numbers_v1alpha1_UpdateNumberRequest (buffer_arg) {
  return numbers_pb.UpdateNumberRequest.deserializeBinary(
    new Uint8Array(buffer_arg)
  )
}
var NumbersService = (exports.NumbersService = {
  // Lists Numbers from the SIP Proxy subsystem
  listNumbers: {
    path: '/yaps.numbers.v1alpha1.Numbers/ListNumbers',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.ListNumbersRequest,
    responseType: numbers_pb.ListNumbersResponse,
    requestSerialize: serialize_yaps_numbers_v1alpha1_ListNumbersRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_ListNumbersRequest,
    responseSerialize: serialize_yaps_numbers_v1alpha1_ListNumbersResponse,
    responseDeserialize: deserialize_yaps_numbers_v1alpha1_ListNumbersResponse
  },
  // Creates a new Number resource.
  createNumber: {
    path: '/yaps.numbers.v1alpha1.Numbers/CreateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.CreateNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_yaps_numbers_v1alpha1_CreateNumberRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_CreateNumberRequest,
    responseSerialize: serialize_yaps_numbers_v1alpha1_Number,
    responseDeserialize: deserialize_yaps_numbers_v1alpha1_Number
  },
  // Get an app for a given e164 number
  getIngressApp: {
    path: '/yaps.numbers.v1alpha1.Numbers/GetIngressApp',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.GetIngressAppRequest,
    responseType: appmanager_pb.App,
    requestSerialize: serialize_yaps_numbers_v1alpha1_GetIngressAppRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_GetIngressAppRequest,
    responseSerialize: serialize_yaps_appmanager_v1alpha1_App,
    responseDeserialize: deserialize_yaps_appmanager_v1alpha1_App
  },
  // Gets Number using its reference
  getNumber: {
    path: '/yaps.numbers.v1alpha1.Numbers/GetNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.GetNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_yaps_numbers_v1alpha1_GetNumberRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_GetNumberRequest,
    responseSerialize: serialize_yaps_numbers_v1alpha1_Number,
    responseDeserialize: deserialize_yaps_numbers_v1alpha1_Number
  },
  // Change or update fields in a resource
  updateNumber: {
    path: '/yaps.numbers.v1alpha1.Numbers/UpdateNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.UpdateNumberRequest,
    responseType: numbers_pb.Number,
    requestSerialize: serialize_yaps_numbers_v1alpha1_UpdateNumberRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_UpdateNumberRequest,
    responseSerialize: serialize_yaps_numbers_v1alpha1_Number,
    responseDeserialize: deserialize_yaps_numbers_v1alpha1_Number
  },
  // Hard delete of a Number resource
  deleteNumber: {
    path: '/yaps.numbers.v1alpha1.Numbers/DeleteNumber',
    requestStream: false,
    responseStream: false,
    requestType: numbers_pb.DeleteNumberRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_yaps_numbers_v1alpha1_DeleteNumberRequest,
    requestDeserialize: deserialize_yaps_numbers_v1alpha1_DeleteNumberRequest,
    responseSerialize: serialize_yaps_common_v1alpha1_Empty,
    responseDeserialize: deserialize_yaps_common_v1alpha1_Empty
  }
})
exports.NumbersClient = grpc.makeGenericClientConstructor(NumbersService)
//# sourceMappingURL=numbers_grpc_pb.js.map
