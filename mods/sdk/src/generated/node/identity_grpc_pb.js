// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
//
// Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
// http://github.com/fonoster/fonoster
//
// This file is part of Fonoster
//
// Licensed under the MIT License (the "License");
// you may not use this file except in compliance with
// the License. You may obtain a copy of the License at
//
//    https://opensource.org/licenses/MIT
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
'use strict';
var grpc = require('@grpc/grpc-js');
var identity_pb = require('./identity_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');

function serialize_fonoster_identity_v1beta2_CreateApiKeyRequest(arg) {
  if (!(arg instanceof identity_pb.CreateApiKeyRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateApiKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateApiKeyRequest(buffer_arg) {
  return identity_pb.CreateApiKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateApiKeyResponse(arg) {
  if (!(arg instanceof identity_pb.CreateApiKeyResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateApiKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateApiKeyResponse(buffer_arg) {
  return identity_pb.CreateApiKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateUserRequest(arg) {
  if (!(arg instanceof identity_pb.CreateUserRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateUserRequest(buffer_arg) {
  return identity_pb.CreateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateUserResponse(arg) {
  if (!(arg instanceof identity_pb.CreateUserResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateUserResponse(buffer_arg) {
  return identity_pb.CreateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateUserWithOauth2CodeRequest(arg) {
  if (!(arg instanceof identity_pb.CreateUserWithOauth2CodeRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateUserWithOauth2CodeRequest(buffer_arg) {
  return identity_pb.CreateUserWithOauth2CodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.CreateWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateWorkspaceRequest(buffer_arg) {
  return identity_pb.CreateWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_CreateWorkspaceResponse(arg) {
  if (!(arg instanceof identity_pb.CreateWorkspaceResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.CreateWorkspaceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_CreateWorkspaceResponse(buffer_arg) {
  return identity_pb.CreateWorkspaceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteApiKeyRequest(arg) {
  if (!(arg instanceof identity_pb.DeleteApiKeyRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteApiKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteApiKeyRequest(buffer_arg) {
  return identity_pb.DeleteApiKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteApiKeyResponse(arg) {
  if (!(arg instanceof identity_pb.DeleteApiKeyResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteApiKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteApiKeyResponse(buffer_arg) {
  return identity_pb.DeleteApiKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteUserRequest(arg) {
  if (!(arg instanceof identity_pb.DeleteUserRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteUserRequest(buffer_arg) {
  return identity_pb.DeleteUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteUserResponse(arg) {
  if (!(arg instanceof identity_pb.DeleteUserResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteUserResponse(buffer_arg) {
  return identity_pb.DeleteUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.DeleteWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteWorkspaceRequest(buffer_arg) {
  return identity_pb.DeleteWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_DeleteWorkspaceResponse(arg) {
  if (!(arg instanceof identity_pb.DeleteWorkspaceResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.DeleteWorkspaceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_DeleteWorkspaceResponse(buffer_arg) {
  return identity_pb.DeleteWorkspaceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeApiKeyRequest(arg) {
  if (!(arg instanceof identity_pb.ExchangeApiKeyRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeApiKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeApiKeyRequest(buffer_arg) {
  return identity_pb.ExchangeApiKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeApiKeyResponse(arg) {
  if (!(arg instanceof identity_pb.ExchangeApiKeyResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeApiKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeApiKeyResponse(buffer_arg) {
  return identity_pb.ExchangeApiKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeCredentialsRequest(arg) {
  if (!(arg instanceof identity_pb.ExchangeCredentialsRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeCredentialsRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeCredentialsRequest(buffer_arg) {
  return identity_pb.ExchangeCredentialsRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse(arg) {
  if (!(arg instanceof identity_pb.ExchangeCredentialsResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeCredentialsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse(buffer_arg) {
  return identity_pb.ExchangeCredentialsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeOauth2CodeRequest(arg) {
  if (!(arg instanceof identity_pb.ExchangeOauth2CodeRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeOauth2CodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeOauth2CodeRequest(buffer_arg) {
  return identity_pb.ExchangeOauth2CodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeOauth2CodeResponse(arg) {
  if (!(arg instanceof identity_pb.ExchangeOauth2CodeResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeOauth2CodeResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeOauth2CodeResponse(buffer_arg) {
  return identity_pb.ExchangeOauth2CodeResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeRefreshTokenRequest(arg) {
  if (!(arg instanceof identity_pb.ExchangeRefreshTokenRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeRefreshTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeRefreshTokenRequest(buffer_arg) {
  return identity_pb.ExchangeRefreshTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ExchangeRefreshTokenResponse(arg) {
  if (!(arg instanceof identity_pb.ExchangeRefreshTokenResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ExchangeRefreshTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ExchangeRefreshTokenResponse(buffer_arg) {
  return identity_pb.ExchangeRefreshTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_GetPublicKeyResponse(arg) {
  if (!(arg instanceof identity_pb.GetPublicKeyResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.GetPublicKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_GetPublicKeyResponse(buffer_arg) {
  return identity_pb.GetPublicKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_GetUserRequest(arg) {
  if (!(arg instanceof identity_pb.GetUserRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.GetUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_GetUserRequest(buffer_arg) {
  return identity_pb.GetUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_GetWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.GetWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.GetWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_GetWorkspaceRequest(buffer_arg) {
  return identity_pb.GetWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_InviteUserToWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.InviteUserToWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.InviteUserToWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_InviteUserToWorkspaceRequest(buffer_arg) {
  return identity_pb.InviteUserToWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_InviteUserToWorkspaceResponse(arg) {
  if (!(arg instanceof identity_pb.InviteUserToWorkspaceResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.InviteUserToWorkspaceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_InviteUserToWorkspaceResponse(buffer_arg) {
  return identity_pb.InviteUserToWorkspaceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListApiKeysRequest(arg) {
  if (!(arg instanceof identity_pb.ListApiKeysRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListApiKeysRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListApiKeysRequest(buffer_arg) {
  return identity_pb.ListApiKeysRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListApiKeysResponse(arg) {
  if (!(arg instanceof identity_pb.ListApiKeysResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListApiKeysResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListApiKeysResponse(buffer_arg) {
  return identity_pb.ListApiKeysResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListWorkspaceMembersRequest(arg) {
  if (!(arg instanceof identity_pb.ListWorkspaceMembersRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListWorkspaceMembersRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListWorkspaceMembersRequest(buffer_arg) {
  return identity_pb.ListWorkspaceMembersRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListWorkspaceMembersResponse(arg) {
  if (!(arg instanceof identity_pb.ListWorkspaceMembersResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListWorkspaceMembersResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListWorkspaceMembersResponse(buffer_arg) {
  return identity_pb.ListWorkspaceMembersResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListWorkspacesRequest(arg) {
  if (!(arg instanceof identity_pb.ListWorkspacesRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListWorkspacesRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListWorkspacesRequest(buffer_arg) {
  return identity_pb.ListWorkspacesRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ListWorkspacesResponse(arg) {
  if (!(arg instanceof identity_pb.ListWorkspacesResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ListWorkspacesResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ListWorkspacesResponse(buffer_arg) {
  return identity_pb.ListWorkspacesResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RegenerateApiKeyRequest(arg) {
  if (!(arg instanceof identity_pb.RegenerateApiKeyRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RegenerateApiKeyRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RegenerateApiKeyRequest(buffer_arg) {
  return identity_pb.RegenerateApiKeyRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RegenerateApiKeyResponse(arg) {
  if (!(arg instanceof identity_pb.RegenerateApiKeyResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RegenerateApiKeyResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RegenerateApiKeyResponse(buffer_arg) {
  return identity_pb.RegenerateApiKeyResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.RemoveUserFromWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceRequest(buffer_arg) {
  return identity_pb.RemoveUserFromWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceResponse(arg) {
  if (!(arg instanceof identity_pb.RemoveUserFromWorkspaceResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceResponse(buffer_arg) {
  return identity_pb.RemoveUserFromWorkspaceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationRequest(arg) {
  if (!(arg instanceof identity_pb.ResendWorkspaceMembershipInvitationRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationRequest(buffer_arg) {
  return identity_pb.ResendWorkspaceMembershipInvitationRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationResponse(arg) {
  if (!(arg instanceof identity_pb.ResendWorkspaceMembershipInvitationResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationResponse(buffer_arg) {
  return identity_pb.ResendWorkspaceMembershipInvitationResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_ResetPasswordRequest(arg) {
  if (!(arg instanceof identity_pb.ResetPasswordRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.ResetPasswordRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_ResetPasswordRequest(buffer_arg) {
  return identity_pb.ResetPasswordRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RevokeTokenRequest(arg) {
  if (!(arg instanceof identity_pb.RevokeTokenRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RevokeTokenRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RevokeTokenRequest(buffer_arg) {
  return identity_pb.RevokeTokenRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_RevokeTokenResponse(arg) {
  if (!(arg instanceof identity_pb.RevokeTokenResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.RevokeTokenResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_RevokeTokenResponse(buffer_arg) {
  return identity_pb.RevokeTokenResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_SendResetPasswordCodeRequest(arg) {
  if (!(arg instanceof identity_pb.SendResetPasswordCodeRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.SendResetPasswordCodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_SendResetPasswordCodeRequest(buffer_arg) {
  return identity_pb.SendResetPasswordCodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_SendVerificationCodeRequest(arg) {
  if (!(arg instanceof identity_pb.SendVerificationCodeRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.SendVerificationCodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_SendVerificationCodeRequest(buffer_arg) {
  return identity_pb.SendVerificationCodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_UpdateUserRequest(arg) {
  if (!(arg instanceof identity_pb.UpdateUserRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.UpdateUserRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_UpdateUserRequest(buffer_arg) {
  return identity_pb.UpdateUserRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_UpdateUserResponse(arg) {
  if (!(arg instanceof identity_pb.UpdateUserResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.UpdateUserResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_UpdateUserResponse(buffer_arg) {
  return identity_pb.UpdateUserResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_UpdateWorkspaceRequest(arg) {
  if (!(arg instanceof identity_pb.UpdateWorkspaceRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.UpdateWorkspaceRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_UpdateWorkspaceRequest(buffer_arg) {
  return identity_pb.UpdateWorkspaceRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_UpdateWorkspaceResponse(arg) {
  if (!(arg instanceof identity_pb.UpdateWorkspaceResponse)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.UpdateWorkspaceResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_UpdateWorkspaceResponse(buffer_arg) {
  return identity_pb.UpdateWorkspaceResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_User(arg) {
  if (!(arg instanceof identity_pb.User)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.User');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_User(buffer_arg) {
  return identity_pb.User.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_VerifyCodeRequest(arg) {
  if (!(arg instanceof identity_pb.VerifyCodeRequest)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.VerifyCodeRequest');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_VerifyCodeRequest(buffer_arg) {
  return identity_pb.VerifyCodeRequest.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_fonoster_identity_v1beta2_Workspace(arg) {
  if (!(arg instanceof identity_pb.Workspace)) {
    throw new Error('Expected argument of type fonoster.identity.v1beta2.Workspace');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_fonoster_identity_v1beta2_Workspace(buffer_arg) {
  return identity_pb.Workspace.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}


var IdentityService = exports.IdentityService = {
  // Workspace actions
createWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/CreateWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.CreateWorkspaceRequest,
    responseType: identity_pb.CreateWorkspaceResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_CreateWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_CreateWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_CreateWorkspaceResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_CreateWorkspaceResponse,
  },
  deleteWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/DeleteWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.DeleteWorkspaceRequest,
    responseType: identity_pb.DeleteWorkspaceResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_DeleteWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_DeleteWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_DeleteWorkspaceResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_DeleteWorkspaceResponse,
  },
  getWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/GetWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.GetWorkspaceRequest,
    responseType: identity_pb.Workspace,
    requestSerialize: serialize_fonoster_identity_v1beta2_GetWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_GetWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_Workspace,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_Workspace,
  },
  listWorkspaces: {
    path: '/fonoster.identity.v1beta2.Identity/ListWorkspaces',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ListWorkspacesRequest,
    responseType: identity_pb.ListWorkspacesResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ListWorkspacesRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ListWorkspacesRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ListWorkspacesResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ListWorkspacesResponse,
  },
  updateWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/UpdateWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.UpdateWorkspaceRequest,
    responseType: identity_pb.UpdateWorkspaceResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_UpdateWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_UpdateWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_UpdateWorkspaceResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_UpdateWorkspaceResponse,
  },
  inviteUserToWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/InviteUserToWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.InviteUserToWorkspaceRequest,
    responseType: identity_pb.InviteUserToWorkspaceResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_InviteUserToWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_InviteUserToWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_InviteUserToWorkspaceResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_InviteUserToWorkspaceResponse,
  },
  removeUserFromWorkspace: {
    path: '/fonoster.identity.v1beta2.Identity/RemoveUserFromWorkspace',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.RemoveUserFromWorkspaceRequest,
    responseType: identity_pb.RemoveUserFromWorkspaceResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_RemoveUserFromWorkspaceResponse,
  },
  resendWorkspaceMembershipInvitation: {
    path: '/fonoster.identity.v1beta2.Identity/ResendWorkspaceMembershipInvitation',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ResendWorkspaceMembershipInvitationRequest,
    responseType: identity_pb.ResendWorkspaceMembershipInvitationResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ResendWorkspaceMembershipInvitationResponse,
  },
  listWorkspaceMembers: {
    path: '/fonoster.identity.v1beta2.Identity/ListWorkspaceMembers',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ListWorkspaceMembersRequest,
    responseType: identity_pb.ListWorkspaceMembersResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ListWorkspaceMembersRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ListWorkspaceMembersRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ListWorkspaceMembersResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ListWorkspaceMembersResponse,
  },
  // User specific actions
createUser: {
    path: '/fonoster.identity.v1beta2.Identity/CreateUser',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.CreateUserRequest,
    responseType: identity_pb.CreateUserResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_CreateUserRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_CreateUserRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_CreateUserResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_CreateUserResponse,
  },
  createUserWithOauth2Code: {
    path: '/fonoster.identity.v1beta2.Identity/CreateUserWithOauth2Code',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.CreateUserWithOauth2CodeRequest,
    responseType: identity_pb.ExchangeCredentialsResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_CreateUserWithOauth2CodeRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_CreateUserWithOauth2CodeRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse,
  },
  getUser: {
    path: '/fonoster.identity.v1beta2.Identity/GetUser',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.GetUserRequest,
    responseType: identity_pb.User,
    requestSerialize: serialize_fonoster_identity_v1beta2_GetUserRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_GetUserRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_User,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_User,
  },
  updateUser: {
    path: '/fonoster.identity.v1beta2.Identity/UpdateUser',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.UpdateUserRequest,
    responseType: identity_pb.UpdateUserResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_UpdateUserRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_UpdateUserRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_UpdateUserResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_UpdateUserResponse,
  },
  deleteUser: {
    path: '/fonoster.identity.v1beta2.Identity/DeleteUser',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.DeleteUserRequest,
    responseType: identity_pb.DeleteUserResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_DeleteUserRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_DeleteUserRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_DeleteUserResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_DeleteUserResponse,
  },
  sendVerificationCode: {
    path: '/fonoster.identity.v1beta2.Identity/SendVerificationCode',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.SendVerificationCodeRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_fonoster_identity_v1beta2_SendVerificationCodeRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_SendVerificationCodeRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  verifyCode: {
    path: '/fonoster.identity.v1beta2.Identity/VerifyCode',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.VerifyCodeRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_fonoster_identity_v1beta2_VerifyCodeRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_VerifyCodeRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  sendResetPasswordCode: {
    path: '/fonoster.identity.v1beta2.Identity/SendResetPasswordCode',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.SendResetPasswordCodeRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_fonoster_identity_v1beta2_SendResetPasswordCodeRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_SendResetPasswordCodeRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  resetPassword: {
    path: '/fonoster.identity.v1beta2.Identity/ResetPassword',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ResetPasswordRequest,
    responseType: google_protobuf_empty_pb.Empty,
    requestSerialize: serialize_fonoster_identity_v1beta2_ResetPasswordRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ResetPasswordRequest,
    responseSerialize: serialize_google_protobuf_Empty,
    responseDeserialize: deserialize_google_protobuf_Empty,
  },
  // ApiKey actions
createApiKey: {
    path: '/fonoster.identity.v1beta2.Identity/CreateApiKey',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.CreateApiKeyRequest,
    responseType: identity_pb.CreateApiKeyResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_CreateApiKeyRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_CreateApiKeyRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_CreateApiKeyResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_CreateApiKeyResponse,
  },
  deleteApiKey: {
    path: '/fonoster.identity.v1beta2.Identity/DeleteApiKey',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.DeleteApiKeyRequest,
    responseType: identity_pb.DeleteApiKeyResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_DeleteApiKeyRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_DeleteApiKeyRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_DeleteApiKeyResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_DeleteApiKeyResponse,
  },
  listApiKeys: {
    path: '/fonoster.identity.v1beta2.Identity/ListApiKeys',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ListApiKeysRequest,
    responseType: identity_pb.ListApiKeysResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ListApiKeysRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ListApiKeysRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ListApiKeysResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ListApiKeysResponse,
  },
  regenerateApiKey: {
    path: '/fonoster.identity.v1beta2.Identity/RegenerateApiKey',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.RegenerateApiKeyRequest,
    responseType: identity_pb.RegenerateApiKeyResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_RegenerateApiKeyRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_RegenerateApiKeyRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_RegenerateApiKeyResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_RegenerateApiKeyResponse,
  },
  // Token exchange actions
exchangeCredentials: {
    path: '/fonoster.identity.v1beta2.Identity/ExchangeCredentials',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ExchangeCredentialsRequest,
    responseType: identity_pb.ExchangeCredentialsResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ExchangeCredentialsRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeCredentialsRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeCredentialsResponse,
  },
  exchangeApiKey: {
    path: '/fonoster.identity.v1beta2.Identity/ExchangeApiKey',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ExchangeApiKeyRequest,
    responseType: identity_pb.ExchangeApiKeyResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ExchangeApiKeyRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeApiKeyRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ExchangeApiKeyResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeApiKeyResponse,
  },
  exchangeOauth2Code: {
    path: '/fonoster.identity.v1beta2.Identity/ExchangeOauth2Code',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ExchangeOauth2CodeRequest,
    responseType: identity_pb.ExchangeOauth2CodeResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ExchangeOauth2CodeRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeOauth2CodeRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ExchangeOauth2CodeResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeOauth2CodeResponse,
  },
  exchangeRefreshToken: {
    path: '/fonoster.identity.v1beta2.Identity/ExchangeRefreshToken',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.ExchangeRefreshTokenRequest,
    responseType: identity_pb.ExchangeRefreshTokenResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_ExchangeRefreshTokenRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeRefreshTokenRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_ExchangeRefreshTokenResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_ExchangeRefreshTokenResponse,
  },
  revokeToken: {
    path: '/fonoster.identity.v1beta2.Identity/RevokeToken',
    requestStream: false,
    responseStream: false,
    requestType: identity_pb.RevokeTokenRequest,
    responseType: identity_pb.RevokeTokenResponse,
    requestSerialize: serialize_fonoster_identity_v1beta2_RevokeTokenRequest,
    requestDeserialize: deserialize_fonoster_identity_v1beta2_RevokeTokenRequest,
    responseSerialize: serialize_fonoster_identity_v1beta2_RevokeTokenResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_RevokeTokenResponse,
  },
  // Get the public key for verifying JWTs
getPublicKey: {
    path: '/fonoster.identity.v1beta2.Identity/GetPublicKey',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: identity_pb.GetPublicKeyResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_fonoster_identity_v1beta2_GetPublicKeyResponse,
    responseDeserialize: deserialize_fonoster_identity_v1beta2_GetPublicKeyResponse,
  },
};

exports.IdentityClient = grpc.makeGenericClientConstructor(IdentityService, 'Identity');
