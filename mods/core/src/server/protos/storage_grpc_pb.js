// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2020 Fonoster Inc
//
// The Storage proto contains the artificats for bucket and objects
// management.
'use strict';
var grpc = require('grpc');
var storage_pb = require('./storage_pb.js');

function serialize_yaps_storage_v1alpha1_UploadObjectRequest(arg) {
  if (!(arg instanceof storage_pb.UploadObjectRequest)) {
    throw new Error('Expected argument of type yaps.storage.v1alpha1.UploadObjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_yaps_storage_v1alpha1_UploadObjectRequest(buffer_arg) {
  return storage_pb.UploadObjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_yaps_storage_v1alpha1_UploadObjectResponse(arg) {
  if (!(arg instanceof storage_pb.UploadObjectResponse)) {
    throw new Error('Expected argument of type yaps.storage.v1alpha1.UploadObjectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_yaps_storage_v1alpha1_UploadObjectResponse(buffer_arg) {
  return storage_pb.UploadObjectResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var StorageService = exports.StorageService = {
  uploadObject: {
    path: '/yaps.storage.v1alpha1.Storage/UploadObject',
    requestStream: true,
    responseStream: false,
    requestType: storage_pb.UploadObjectRequest,
    responseType: storage_pb.UploadObjectResponse,
    requestSerialize: serialize_yaps_storage_v1alpha1_UploadObjectRequest,
    requestDeserialize: deserialize_yaps_storage_v1alpha1_UploadObjectRequest,
    responseSerialize: serialize_yaps_storage_v1alpha1_UploadObjectResponse,
    responseDeserialize: deserialize_yaps_storage_v1alpha1_UploadObjectResponse,
  },
};

exports.StorageClient = grpc.makeGenericClientConstructor(StorageService);
