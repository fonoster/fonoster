// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The CallMananger proto contains the artificats for the call mananger
// such as creation and deployment.
'use strict';
var grpc = require('@grpc/grpc-js');
var callmanager_pb = require('./callmanager_pb.js');
var protoc$gen$openapiv2_options_annotations_pb = require('./protoc-gen-openapiv2/options/annotations_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');

function serialize_fonoster_callmanager_v1beta1_CallRequest(arg) {
  if (!(arg instanceof callmanager_pb.CallRequest)) {
    throw new Error('Expected argument of type fonoster.callmanager.v1beta1.CallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_callmanager_v1beta1_CallRequest(buffer_arg) {
  return callmanager_pb.CallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_callmanager_v1beta1_CallResponse(arg) {
  if (!(arg instanceof callmanager_pb.CallResponse)) {
    throw new Error('Expected argument of type fonoster.callmanager.v1beta1.CallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_callmanager_v1beta1_CallResponse(buffer_arg) {
  return callmanager_pb.CallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var CallManagerService = exports.CallManagerService = {
  // Originates a call and pass channel to an application
call: {
    path: '/fonoster.callmanager.v1beta1.CallManager/Call',
    requestStream: false,
    responseStream: false,
    requestType: callmanager_pb.CallRequest,
    responseType: callmanager_pb.CallResponse,
    requestSerialize: serialize_fonoster_callmanager_v1beta1_CallRequest,
    requestDeserialize: deserialize_fonoster_callmanager_v1beta1_CallRequest,
    responseSerialize: serialize_fonoster_callmanager_v1beta1_CallResponse,
    responseDeserialize: deserialize_fonoster_callmanager_v1beta1_CallResponse,
  },
};

exports.CallManagerClient = grpc.makeGenericClientConstructor(CallManagerService);
