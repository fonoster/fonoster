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

function serialize_fonos_callmanager_v1alpha1_CallRequest(arg) {
  if (!(arg instanceof callmanager_pb.CallRequest)) {
    throw new Error('Expected argument of type fonos.callmanager.v1alpha1.CallRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_callmanager_v1alpha1_CallRequest(buffer_arg) {
  return callmanager_pb.CallRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonos_callmanager_v1alpha1_CallResponse(arg) {
  if (!(arg instanceof callmanager_pb.CallResponse)) {
    throw new Error('Expected argument of type fonos.callmanager.v1alpha1.CallResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonos_callmanager_v1alpha1_CallResponse(buffer_arg) {
  return callmanager_pb.CallResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var CallManagerService = exports.CallManagerService = {
  // Originates a call and pass channel to an application
call: {
    path: '/fonos.callmanager.v1alpha1.CallManager/Call',
    requestStream: false,
    responseStream: false,
    requestType: callmanager_pb.CallRequest,
    responseType: callmanager_pb.CallResponse,
    requestSerialize: serialize_fonos_callmanager_v1alpha1_CallRequest,
    requestDeserialize: deserialize_fonos_callmanager_v1alpha1_CallRequest,
    responseSerialize: serialize_fonos_callmanager_v1alpha1_CallResponse,
    responseDeserialize: deserialize_fonos_callmanager_v1alpha1_CallResponse,
  },
};

exports.CallManagerClient = grpc.makeGenericClientConstructor(CallManagerService);
