// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Numbers proto contains the artificats for numbers administration
'use strict'
var grpc = require('grpc')
var numbers_pb = require('./numbers_pb.js')
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

function serialize_yaps_numbers_v1alpha1_Number (arg) {
  if (!(arg instanceof numbers_pb.Number)) {
    throw new Error('Expected argument of type yaps.numbers.v1alpha1.Number')
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_yaps_numbers_v1alpha1_Number (buffer_arg) {
  return numbers_pb.Number.deserializeBinary(new Uint8Array(buffer_arg))
}

var NumbersService = (exports.NumbersService = {
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
  }
})

exports.NumbersClient = grpc.makeGenericClientConstructor(NumbersService)
