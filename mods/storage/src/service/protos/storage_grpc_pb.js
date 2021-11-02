// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Storage proto contains the artificats for bucket and objects
// management.
'use strict';
var grpc = require('@grpc/grpc-js');
var storage_pb = require('./storage_pb.js');
var google_api_annotations_pb = require('./google/api/annotations_pb.js');

function serialize_fonoster_storage_v1beta1_GetObjectURLRequest(arg) {
  if (!(arg instanceof storage_pb.GetObjectURLRequest)) {
    throw new Error('Expected argument of type fonoster.storage.v1beta1.GetObjectURLRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_storage_v1beta1_GetObjectURLRequest(buffer_arg) {
  return storage_pb.GetObjectURLRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_storage_v1beta1_GetObjectURLResponse(arg) {
  if (!(arg instanceof storage_pb.GetObjectURLResponse)) {
    throw new Error('Expected argument of type fonoster.storage.v1beta1.GetObjectURLResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_storage_v1beta1_GetObjectURLResponse(buffer_arg) {
  return storage_pb.GetObjectURLResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_storage_v1beta1_UploadObjectRequest(arg) {
  if (!(arg instanceof storage_pb.UploadObjectRequest)) {
    throw new Error('Expected argument of type fonoster.storage.v1beta1.UploadObjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_storage_v1beta1_UploadObjectRequest(buffer_arg) {
  return storage_pb.UploadObjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_storage_v1beta1_UploadObjectResponse(arg) {
  if (!(arg instanceof storage_pb.UploadObjectResponse)) {
    throw new Error('Expected argument of type fonoster.storage.v1beta1.UploadObjectResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_storage_v1beta1_UploadObjectResponse(buffer_arg) {
  return storage_pb.UploadObjectResponse.deserializeBinary(new Uint8Array(buffer_arg));
}


var StorageService = exports.StorageService = {
  uploadObject: {
    path: '/fonoster.storage.v1beta1.Storage/UploadObject',
    requestStream: true,
    responseStream: false,
    requestType: storage_pb.UploadObjectRequest,
    responseType: storage_pb.UploadObjectResponse,
    requestSerialize: serialize_fonoster_storage_v1beta1_UploadObjectRequest,
    requestDeserialize: deserialize_fonoster_storage_v1beta1_UploadObjectRequest,
    responseSerialize: serialize_fonoster_storage_v1beta1_UploadObjectResponse,
    responseDeserialize: deserialize_fonoster_storage_v1beta1_UploadObjectResponse,
  },
  getObjectURL: {
    path: '/fonoster.storage.v1beta1.Storage/GetObjectURL',
    requestStream: false,
    responseStream: false,
    requestType: storage_pb.GetObjectURLRequest,
    responseType: storage_pb.GetObjectURLResponse,
    requestSerialize: serialize_fonoster_storage_v1beta1_GetObjectURLRequest,
    requestDeserialize: deserialize_fonoster_storage_v1beta1_GetObjectURLRequest,
    responseSerialize: serialize_fonoster_storage_v1beta1_GetObjectURLResponse,
    responseDeserialize: deserialize_fonoster_storage_v1beta1_GetObjectURLResponse,
  },
};

exports.StorageClient = grpc.makeGenericClientConstructor(StorageService);
