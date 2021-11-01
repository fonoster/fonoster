// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// *
// MIT License
// Copyright (c) 2021 Fonoster Inc
//
// The Users proto contains the artificats for the administration
// of Users.
'use strict';
var grpc = require('@grpc/grpc-js');
var projects_pb = require('./projects_pb.js');
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

function serialize_fonoster_projects_v1beta1_CreateProjectRequest(arg) {
  if (!(arg instanceof projects_pb.CreateProjectRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.CreateProjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_CreateProjectRequest(buffer_arg) {
  return projects_pb.CreateProjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_DeleteProjectRequest(arg) {
  if (!(arg instanceof projects_pb.DeleteProjectRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.DeleteProjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_DeleteProjectRequest(buffer_arg) {
  return projects_pb.DeleteProjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_GetProjectRequest(arg) {
  if (!(arg instanceof projects_pb.GetProjectRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.GetProjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_GetProjectRequest(buffer_arg) {
  return projects_pb.GetProjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_ListProjectsRequest(arg) {
  if (!(arg instanceof projects_pb.ListProjectsRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.ListProjectsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_ListProjectsRequest(buffer_arg) {
  return projects_pb.ListProjectsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_ListProjectsResponse(arg) {
  if (!(arg instanceof projects_pb.ListProjectsResponse)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.ListProjectsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_ListProjectsResponse(buffer_arg) {
  return projects_pb.ListProjectsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_Project(arg) {
  if (!(arg instanceof projects_pb.Project)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.Project');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_Project(buffer_arg) {
  return projects_pb.Project.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_RenewAccessKeySecretRequest(arg) {
  if (!(arg instanceof projects_pb.RenewAccessKeySecretRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.RenewAccessKeySecretRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_RenewAccessKeySecretRequest(buffer_arg) {
  return projects_pb.RenewAccessKeySecretRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_RenewAccessKeySecretResponse(arg) {
  if (!(arg instanceof projects_pb.RenewAccessKeySecretResponse)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.RenewAccessKeySecretResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_RenewAccessKeySecretResponse(buffer_arg) {
  return projects_pb.RenewAccessKeySecretResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_projects_v1beta1_UpdateProjectRequest(arg) {
  if (!(arg instanceof projects_pb.UpdateProjectRequest)) {
    throw new Error('Expected argument of type fonoster.projects.v1beta1.UpdateProjectRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_projects_v1beta1_UpdateProjectRequest(buffer_arg) {
  return projects_pb.UpdateProjectRequest.deserializeBinary(new Uint8Array(buffer_arg));
}


var ProjectsService = exports.ProjectsService = {
  // Lists all the Projects for a given User
listProjects: {
    path: '/fonoster.projects.v1beta1.Projects/ListProjects',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.ListProjectsRequest,
    responseType: projects_pb.ListProjectsResponse,
    requestSerialize: serialize_fonoster_projects_v1beta1_ListProjectsRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_ListProjectsRequest,
    responseSerialize: serialize_fonoster_projects_v1beta1_ListProjectsResponse,
    responseDeserialize: deserialize_fonoster_projects_v1beta1_ListProjectsResponse,
  },
  // Creates a new Project resource
createProject: {
    path: '/fonoster.projects.v1beta1.Projects/CreateProject',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.CreateProjectRequest,
    responseType: projects_pb.Project,
    requestSerialize: serialize_fonoster_projects_v1beta1_CreateProjectRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_CreateProjectRequest,
    responseSerialize: serialize_fonoster_projects_v1beta1_Project,
    responseDeserialize: deserialize_fonoster_projects_v1beta1_Project,
  },
  // Updates a given Project
updateProject: {
    path: '/fonoster.projects.v1beta1.Projects/UpdateProject',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.UpdateProjectRequest,
    responseType: projects_pb.Project,
    requestSerialize: serialize_fonoster_projects_v1beta1_UpdateProjectRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_UpdateProjectRequest,
    responseSerialize: serialize_fonoster_projects_v1beta1_Project,
    responseDeserialize: deserialize_fonoster_projects_v1beta1_Project,
  },
  // Gets a Project by AccessKeyId
getProject: {
    path: '/fonoster.projects.v1beta1.Projects/GetProject',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.GetProjectRequest,
    responseType: projects_pb.Project,
    requestSerialize: serialize_fonoster_projects_v1beta1_GetProjectRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_GetProjectRequest,
    responseSerialize: serialize_fonoster_projects_v1beta1_Project,
    responseDeserialize: deserialize_fonoster_projects_v1beta1_Project,
  },
  // WARNING: Hard delete of a Project will remove all related resources 
deleteProject: {
    path: '/fonoster.projects.v1beta1.Projects/DeleteProject',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.DeleteProjectRequest,
    responseType: common_pb.Empty,
    requestSerialize: serialize_fonoster_projects_v1beta1_DeleteProjectRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_DeleteProjectRequest,
    responseSerialize: serialize_fonoster_common_v1beta1_Empty,
    responseDeserialize: deserialize_fonoster_common_v1beta1_Empty,
  },
  // Regenerates the accessKeySecret
renewAccessKeySecret: {
    path: '/fonoster.projects.v1beta1.Projects/RenewAccessKeySecret',
    requestStream: false,
    responseStream: false,
    requestType: projects_pb.RenewAccessKeySecretRequest,
    responseType: projects_pb.RenewAccessKeySecretResponse,
    requestSerialize: serialize_fonoster_projects_v1beta1_RenewAccessKeySecretRequest,
    requestDeserialize: deserialize_fonoster_projects_v1beta1_RenewAccessKeySecretRequest,
    responseSerialize: serialize_fonoster_projects_v1beta1_RenewAccessKeySecretResponse,
    responseDeserialize: deserialize_fonoster_projects_v1beta1_RenewAccessKeySecretResponse,
  },
};

exports.ProjectsClient = grpc.makeGenericClientConstructor(ProjectsService);
