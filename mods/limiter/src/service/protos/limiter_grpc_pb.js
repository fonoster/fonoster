// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2022 Fonoster Inc
//
// The Limiter proto is a simpler Resource Limiter that can be used to limit the number 
// of resources that an User can have.
'use strict';
var grpc = require('@grpc/grpc-js');
var limiter_pb = require('./limiter_pb.js');

function serialize_fonoster_limiter_v1beta1_CheckAuthorizedRequest(arg) {
  if (!(arg instanceof limiter_pb.CheckAuthorizedRequest)) {
    throw new Error('Expected argument of type fonoster.limiter.v1beta1.CheckAuthorizedRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_limiter_v1beta1_CheckAuthorizedRequest(buffer_arg) {
  return limiter_pb.CheckAuthorizedRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_limiter_v1beta1_CheckAuthorizedResponse(arg) {
  if (!(arg instanceof limiter_pb.CheckAuthorizedResponse)) {
    throw new Error('Expected argument of type fonoster.limiter.v1beta1.CheckAuthorizedResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_limiter_v1beta1_CheckAuthorizedResponse(buffer_arg) {
  return limiter_pb.CheckAuthorizedResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var LimiterService = exports.LimiterService = {
  checkAuthorized: {
    path: '/fonoster.limiter.v1beta1.Limiter/CheckAuthorized',
    requestStream: false,
    responseStream: false,
    requestType: limiter_pb.CheckAuthorizedRequest,
    responseType: limiter_pb.CheckAuthorizedResponse,
    requestSerialize: serialize_fonoster_limiter_v1beta1_CheckAuthorizedRequest,
    requestDeserialize: deserialize_fonoster_limiter_v1beta1_CheckAuthorizedRequest,
    responseSerialize: serialize_fonoster_limiter_v1beta1_CheckAuthorizedResponse,
    responseDeserialize: deserialize_fonoster_limiter_v1beta1_CheckAuthorizedResponse,
  },
};

exports.LimiterClient = grpc.makeGenericClientConstructor(LimiterService);
