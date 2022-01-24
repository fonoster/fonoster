// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
'use strict';
var grpc = require('@grpc/grpc-js');
var monitor_pb = require('./monitor_pb.js');
var google_protobuf_struct_pb = require('google-protobuf/google/protobuf/struct_pb.js');

function serialize_fonoster_monitor_v1beta1_Event(arg) {
  if (!(arg instanceof monitor_pb.Event)) {
    throw new Error('Expected argument of type fonoster.monitor.v1beta1.Event');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_monitor_v1beta1_Event(buffer_arg) {
  return monitor_pb.Event.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_monitor_v1beta1_SearchEventsRequest(arg) {
  if (!(arg instanceof monitor_pb.SearchEventsRequest)) {
    throw new Error('Expected argument of type fonoster.monitor.v1beta1.SearchEventsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_monitor_v1beta1_SearchEventsRequest(buffer_arg) {
  return monitor_pb.SearchEventsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var MonitorService = exports.MonitorService = {
  // Gets a stream of events
searchEvents: {
    path: '/fonoster.monitor.v1beta1.Monitor/SearchEvents',
    requestStream: false,
    responseStream: true,
    requestType: monitor_pb.SearchEventsRequest,
    responseType: monitor_pb.Event,
    requestSerialize: serialize_fonoster_monitor_v1beta1_SearchEventsRequest,
    requestDeserialize: deserialize_fonoster_monitor_v1beta1_SearchEventsRequest,
    responseSerialize: serialize_fonoster_monitor_v1beta1_Event,
    responseDeserialize: deserialize_fonoster_monitor_v1beta1_Event,
  },
};

exports.MonitorClient = grpc.makeGenericClientConstructor(MonitorService);
