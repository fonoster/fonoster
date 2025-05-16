// source: identity.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global =
    (typeof globalThis !== 'undefined' && globalThis) ||
    (typeof window !== 'undefined' && window) ||
    (typeof global !== 'undefined' && global) ||
    (typeof self !== 'undefined' && self) ||
    (function () { return this; }).call(null) ||
    Function('return this')();

var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
goog.object.extend(proto, google_protobuf_empty_pb);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ApiKey', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ContactType', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateApiKeyRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateApiKeyResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateUserRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateUserResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.CreateWorkspaceResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteApiKeyRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteApiKeyResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteUserRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteUserResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.GetPublicKeyResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.GetUserRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.GetWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListApiKeysRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListApiKeysResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListWorkspacesRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ListWorkspacesResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.ResetPasswordRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RevokeTokenRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.RevokeTokenResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.SendVerificationCodeRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.UpdateUserRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.UpdateUserResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.User', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.VerifyCodeRequest', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.Workspace', null, global);
goog.exportSymbol('proto.fonoster.identity.v1beta2.WorkspaceMember', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.Workspace = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.Workspace, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.Workspace.displayName = 'proto.fonoster.identity.v1beta2.Workspace';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.CreateWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateWorkspaceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.displayName = 'proto.fonoster.identity.v1beta2.CreateWorkspaceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.displayName = 'proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.GetWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.GetWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.GetWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListWorkspacesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListWorkspacesRequest.displayName = 'proto.fonoster.identity.v1beta2.ListWorkspacesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fonoster.identity.v1beta2.ListWorkspacesResponse.repeatedFields_, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListWorkspacesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListWorkspacesResponse.displayName = 'proto.fonoster.identity.v1beta2.ListWorkspacesResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.displayName = 'proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.displayName = 'proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.displayName = 'proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.displayName = 'proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.displayName = 'proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.displayName = 'proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.WorkspaceMember = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.WorkspaceMember, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.WorkspaceMember.displayName = 'proto.fonoster.identity.v1beta2.WorkspaceMember';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.displayName = 'proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.repeatedFields_, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.displayName = 'proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateUserRequest.displayName = 'proto.fonoster.identity.v1beta2.CreateUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateUserResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateUserResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateUserResponse.displayName = 'proto.fonoster.identity.v1beta2.CreateUserResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.displayName = 'proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.GetUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.GetUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.GetUserRequest.displayName = 'proto.fonoster.identity.v1beta2.GetUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.User = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.User, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.User.displayName = 'proto.fonoster.identity.v1beta2.User';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.UpdateUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.UpdateUserRequest.displayName = 'proto.fonoster.identity.v1beta2.UpdateUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.UpdateUserResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.UpdateUserResponse.displayName = 'proto.fonoster.identity.v1beta2.UpdateUserResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteUserRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteUserRequest.displayName = 'proto.fonoster.identity.v1beta2.DeleteUserRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteUserResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteUserResponse.displayName = 'proto.fonoster.identity.v1beta2.DeleteUserResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.SendVerificationCodeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.displayName = 'proto.fonoster.identity.v1beta2.SendVerificationCodeRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.VerifyCodeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.VerifyCodeRequest.displayName = 'proto.fonoster.identity.v1beta2.VerifyCodeRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.displayName = 'proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ResetPasswordRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ResetPasswordRequest.displayName = 'proto.fonoster.identity.v1beta2.ResetPasswordRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateApiKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateApiKeyRequest.displayName = 'proto.fonoster.identity.v1beta2.CreateApiKeyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.CreateApiKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.CreateApiKeyResponse.displayName = 'proto.fonoster.identity.v1beta2.CreateApiKeyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteApiKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.displayName = 'proto.fonoster.identity.v1beta2.DeleteApiKeyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.DeleteApiKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.displayName = 'proto.fonoster.identity.v1beta2.DeleteApiKeyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListApiKeysRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListApiKeysRequest.displayName = 'proto.fonoster.identity.v1beta2.ListApiKeysRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.fonoster.identity.v1beta2.ListApiKeysResponse.repeatedFields_, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ListApiKeysResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ListApiKeysResponse.displayName = 'proto.fonoster.identity.v1beta2.ListApiKeysResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.displayName = 'proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.displayName = 'proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ApiKey = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ApiKey, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ApiKey.displayName = 'proto.fonoster.identity.v1beta2.ApiKey';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.displayName = 'proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.displayName = 'proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.displayName = 'proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.displayName = 'proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.displayName = 'proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.displayName = 'proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.displayName = 'proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.displayName = 'proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RevokeTokenRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RevokeTokenRequest.displayName = 'proto.fonoster.identity.v1beta2.RevokeTokenRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.RevokeTokenResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.RevokeTokenResponse.displayName = 'proto.fonoster.identity.v1beta2.RevokeTokenResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.fonoster.identity.v1beta2.GetPublicKeyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.fonoster.identity.v1beta2.GetPublicKeyResponse.displayName = 'proto.fonoster.identity.v1beta2.GetPublicKeyResponse';
}



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.Workspace.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.Workspace} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.Workspace.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
name: jspb.Message.getFieldWithDefault(msg, 2, ""),
ownerRef: jspb.Message.getFieldWithDefault(msg, 3, ""),
accessKeyId: jspb.Message.getFieldWithDefault(msg, 4, ""),
createdAt: jspb.Message.getFieldWithDefault(msg, 5, 0),
updatedAt: jspb.Message.getFieldWithDefault(msg, 6, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.Workspace}
 */
proto.fonoster.identity.v1beta2.Workspace.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.Workspace;
  return proto.fonoster.identity.v1beta2.Workspace.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.Workspace} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.Workspace}
 */
proto.fonoster.identity.v1beta2.Workspace.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOwnerRef(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeyId(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCreatedAt(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.Workspace.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.Workspace} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.Workspace.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOwnerRef();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAccessKeyId();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getCreatedAt();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getUpdatedAt();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string owner_ref = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getOwnerRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setOwnerRef = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string access_key_id = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getAccessKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setAccessKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int32 created_at = 5;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getCreatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setCreatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 updated_at = 6;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.getUpdatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.Workspace} returns this
 */
proto.fonoster.identity.v1beta2.Workspace.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
name: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateWorkspaceResponse;
  return proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateWorkspaceResponse} returns this
 */
proto.fonoster.identity.v1beta2.CreateWorkspaceResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse;
  return proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse} returns this
 */
proto.fonoster.identity.v1beta2.DeleteWorkspaceResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.GetWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.GetWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.GetWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.GetWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.GetWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.GetWorkspaceRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListWorkspacesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
pageToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
pageSize: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListWorkspacesRequest;
  return proto.fonoster.identity.v1beta2.ListWorkspacesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPageToken(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPageSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListWorkspacesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPageToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPageSize();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string page_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.getPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.setPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 page_size = 2;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.getPageSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspacesRequest.prototype.setPageSize = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListWorkspacesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
itemsList: jspb.Message.toObjectList(msg.getItemsList(),
    proto.fonoster.identity.v1beta2.Workspace.toObject, includeInstance),
nextPageToken: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListWorkspacesResponse;
  return proto.fonoster.identity.v1beta2.ListWorkspacesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fonoster.identity.v1beta2.Workspace;
      reader.readMessage(value,proto.fonoster.identity.v1beta2.Workspace.deserializeBinaryFromReader);
      msg.addItems(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setNextPageToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListWorkspacesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItemsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.fonoster.identity.v1beta2.Workspace.serializeBinaryToWriter
    );
  }
  f = message.getNextPageToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * repeated Workspace items = 1;
 * @return {!Array<!proto.fonoster.identity.v1beta2.Workspace>}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.getItemsList = function() {
  return /** @type{!Array<!proto.fonoster.identity.v1beta2.Workspace>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fonoster.identity.v1beta2.Workspace, 1));
};


/**
 * @param {!Array<!proto.fonoster.identity.v1beta2.Workspace>} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} returns this
*/
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.setItemsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fonoster.identity.v1beta2.Workspace=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fonoster.identity.v1beta2.Workspace}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.addItems = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fonoster.identity.v1beta2.Workspace, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.clearItemsList = function() {
  return this.setItemsList([]);
};


/**
 * optional string next_page_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.getNextPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspacesResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspacesResponse.prototype.setNextPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
name: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string name = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse;
  return proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse} returns this
 */
proto.fonoster.identity.v1beta2.UpdateWorkspaceResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
email: jspb.Message.getFieldWithDefault(msg, 1, ""),
role: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setRole(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRole();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string email = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string role = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.getRole = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.setRole = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
userRef: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse;
  return proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse} returns this
 */
proto.fonoster.identity.v1beta2.InviteUserToWorkspaceResponse.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
userRef: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest;
  return proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest} returns this
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceRequest.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
userRef: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse;
  return proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse} returns this
 */
proto.fonoster.identity.v1beta2.RemoveUserFromWorkspaceResponse.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
userRef: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest;
  return proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest} returns this
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationRequest.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
userRef: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse;
  return proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string user_ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse} returns this
 */
proto.fonoster.identity.v1beta2.ResendWorkspaceMembershipInvitationResponse.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.WorkspaceMember.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.WorkspaceMember} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
userRef: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
email: jspb.Message.getFieldWithDefault(msg, 4, ""),
role: jspb.Message.getFieldWithDefault(msg, 5, ""),
status: jspb.Message.getFieldWithDefault(msg, 6, ""),
createdAt: jspb.Message.getFieldWithDefault(msg, 7, 0),
updatedAt: jspb.Message.getFieldWithDefault(msg, 8, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.WorkspaceMember;
  return proto.fonoster.identity.v1beta2.WorkspaceMember.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.WorkspaceMember} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setUserRef(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setRole(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setStatus(value);
      break;
    case 7:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCreatedAt(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.WorkspaceMember.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.WorkspaceMember} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getUserRef();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getRole();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getStatus();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getCreatedAt();
  if (f !== 0) {
    writer.writeInt32(
      7,
      f
    );
  }
  f = message.getUpdatedAt();
  if (f !== 0) {
    writer.writeInt32(
      8,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string user_ref = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getUserRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setUserRef = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string email = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string role = 5;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getRole = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setRole = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string status = 6;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getStatus = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setStatus = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * optional int32 created_at = 7;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getCreatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 7, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setCreatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 7, value);
};


/**
 * optional int32 updated_at = 8;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.getUpdatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember} returns this
 */
proto.fonoster.identity.v1beta2.WorkspaceMember.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
pageToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
pageSize: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest;
  return proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPageToken(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPageSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPageToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPageSize();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string page_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.getPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.setPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 page_size = 2;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.getPageSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersRequest.prototype.setPageSize = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
itemsList: jspb.Message.toObjectList(msg.getItemsList(),
    proto.fonoster.identity.v1beta2.WorkspaceMember.toObject, includeInstance),
nextPageToken: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse;
  return proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fonoster.identity.v1beta2.WorkspaceMember;
      reader.readMessage(value,proto.fonoster.identity.v1beta2.WorkspaceMember.deserializeBinaryFromReader);
      msg.addItems(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setNextPageToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItemsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.fonoster.identity.v1beta2.WorkspaceMember.serializeBinaryToWriter
    );
  }
  f = message.getNextPageToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * repeated WorkspaceMember items = 1;
 * @return {!Array<!proto.fonoster.identity.v1beta2.WorkspaceMember>}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.getItemsList = function() {
  return /** @type{!Array<!proto.fonoster.identity.v1beta2.WorkspaceMember>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fonoster.identity.v1beta2.WorkspaceMember, 1));
};


/**
 * @param {!Array<!proto.fonoster.identity.v1beta2.WorkspaceMember>} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} returns this
*/
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.setItemsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fonoster.identity.v1beta2.WorkspaceMember=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fonoster.identity.v1beta2.WorkspaceMember}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.addItems = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fonoster.identity.v1beta2.WorkspaceMember, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.clearItemsList = function() {
  return this.setItemsList([]);
};


/**
 * optional string next_page_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.getNextPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListWorkspaceMembersResponse.prototype.setNextPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
email: jspb.Message.getFieldWithDefault(msg, 1, ""),
password: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
avatar: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateUserRequest;
  return proto.fonoster.identity.v1beta2.CreateUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAvatar(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAvatar();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string email = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string avatar = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.getAvatar = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserRequest.prototype.setAvatar = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateUserResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateUserResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserResponse}
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateUserResponse;
  return proto.fonoster.identity.v1beta2.CreateUserResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserResponse}
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateUserResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserResponse} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
code: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest}
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest;
  return proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest}
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setCode(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getCode();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string code = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.prototype.getCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateUserWithOauth2CodeRequest.prototype.setCode = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.GetUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.GetUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.GetUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.GetUserRequest}
 */
proto.fonoster.identity.v1beta2.GetUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.GetUserRequest;
  return proto.fonoster.identity.v1beta2.GetUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.GetUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.GetUserRequest}
 */
proto.fonoster.identity.v1beta2.GetUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.GetUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.GetUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.GetUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.GetUserRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.GetUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.GetUserRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.User.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.User.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.User} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.User.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
email: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
avatar: jspb.Message.getFieldWithDefault(msg, 4, ""),
createdAt: jspb.Message.getFieldWithDefault(msg, 5, 0),
updatedAt: jspb.Message.getFieldWithDefault(msg, 6, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.User}
 */
proto.fonoster.identity.v1beta2.User.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.User;
  return proto.fonoster.identity.v1beta2.User.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.User} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.User}
 */
proto.fonoster.identity.v1beta2.User.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setEmail(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAvatar(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCreatedAt(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.User.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.User.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.User} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.User.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getEmail();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAvatar();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getCreatedAt();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getUpdatedAt();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.User.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string email = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.User.prototype.getEmail = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setEmail = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.User.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string avatar = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.User.prototype.getAvatar = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setAvatar = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int32 created_at = 5;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.User.prototype.getCreatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setCreatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 updated_at = 6;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.User.prototype.getUpdatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.User} returns this
 */
proto.fonoster.identity.v1beta2.User.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.UpdateUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
password: jspb.Message.getFieldWithDefault(msg, 2, ""),
name: jspb.Message.getFieldWithDefault(msg, 3, ""),
avatar: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.UpdateUserRequest;
  return proto.fonoster.identity.v1beta2.UpdateUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setAvatar(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.UpdateUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getAvatar();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string name = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string avatar = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.getAvatar = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.UpdateUserRequest.prototype.setAvatar = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.UpdateUserResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserResponse}
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.UpdateUserResponse;
  return proto.fonoster.identity.v1beta2.UpdateUserResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserResponse}
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.UpdateUserResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.UpdateUserResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.UpdateUserResponse} returns this
 */
proto.fonoster.identity.v1beta2.UpdateUserResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteUserRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserRequest}
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteUserRequest;
  return proto.fonoster.identity.v1beta2.DeleteUserRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserRequest}
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteUserRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserRequest} returns this
 */
proto.fonoster.identity.v1beta2.DeleteUserRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteUserResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserResponse}
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteUserResponse;
  return proto.fonoster.identity.v1beta2.DeleteUserResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserResponse}
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteUserResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteUserResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteUserResponse} returns this
 */
proto.fonoster.identity.v1beta2.DeleteUserResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
contactType: jspb.Message.getFieldWithDefault(msg, 1, 0),
value: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.SendVerificationCodeRequest;
  return proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fonoster.identity.v1beta2.ContactType} */ (reader.readEnum());
      msg.setContactType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getContactType();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional ContactType contact_type = 1;
 * @return {!proto.fonoster.identity.v1beta2.ContactType}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.getContactType = function() {
  return /** @type {!proto.fonoster.identity.v1beta2.ContactType} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fonoster.identity.v1beta2.ContactType} value
 * @return {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.setContactType = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string value = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.SendVerificationCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.SendVerificationCodeRequest.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.VerifyCodeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
contactType: jspb.Message.getFieldWithDefault(msg, 2, 0),
value: jspb.Message.getFieldWithDefault(msg, 3, ""),
verificationCode: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.VerifyCodeRequest;
  return proto.fonoster.identity.v1beta2.VerifyCodeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {!proto.fonoster.identity.v1beta2.ContactType} */ (reader.readEnum());
      msg.setContactType(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setValue(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setVerificationCode(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.VerifyCodeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getContactType();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getValue();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getVerificationCode();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional ContactType contact_type = 2;
 * @return {!proto.fonoster.identity.v1beta2.ContactType}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.getContactType = function() {
  return /** @type {!proto.fonoster.identity.v1beta2.ContactType} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.fonoster.identity.v1beta2.ContactType} value
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.setContactType = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional string value = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.getValue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.setValue = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string verification_code = 4;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.getVerificationCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.VerifyCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.VerifyCodeRequest.prototype.setVerificationCode = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
resetPasswordUrl: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest;
  return proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setResetPasswordUrl(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getResetPasswordUrl();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string reset_password_url = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.getResetPasswordUrl = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.SendResetPasswordCodeRequest.prototype.setResetPasswordUrl = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ResetPasswordRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
password: jspb.Message.getFieldWithDefault(msg, 2, ""),
verificationCode: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ResetPasswordRequest}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ResetPasswordRequest;
  return proto.fonoster.identity.v1beta2.ResetPasswordRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ResetPasswordRequest}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setVerificationCode(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ResetPasswordRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVerificationCode();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} returns this
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} returns this
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string verification_code = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.getVerificationCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ResetPasswordRequest} returns this
 */
proto.fonoster.identity.v1beta2.ResetPasswordRequest.prototype.setVerificationCode = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateApiKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
role: jspb.Message.getFieldWithDefault(msg, 1, ""),
expiresAt: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateApiKeyRequest;
  return proto.fonoster.identity.v1beta2.CreateApiKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRole(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setExpiresAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateApiKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRole();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getExpiresAt();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string role = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.getRole = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.setRole = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 expires_at = 2;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.getExpiresAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.CreateApiKeyRequest.prototype.setExpiresAt = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.CreateApiKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessKeyId: jspb.Message.getFieldWithDefault(msg, 2, ""),
accessKeySecret: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.CreateApiKeyResponse;
  return proto.fonoster.identity.v1beta2.CreateApiKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeyId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeySecret(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.CreateApiKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessKeyId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getAccessKeySecret();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_key_id = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.getAccessKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.setAccessKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string access_key_secret = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.getAccessKeySecret = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.CreateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.CreateApiKeyResponse.prototype.setAccessKeySecret = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteApiKeyRequest;
  return proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.DeleteApiKeyResponse;
  return proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.DeleteApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.DeleteApiKeyResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListApiKeysRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
pageToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
pageSize: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysRequest}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListApiKeysRequest;
  return proto.fonoster.identity.v1beta2.ListApiKeysRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysRequest}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPageToken(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPageSize(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListApiKeysRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPageToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPageSize();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional string page_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.getPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.setPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 page_size = 2;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.getPageSize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysRequest} returns this
 */
proto.fonoster.identity.v1beta2.ListApiKeysRequest.prototype.setPageSize = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ListApiKeysResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
itemsList: jspb.Message.toObjectList(msg.getItemsList(),
    proto.fonoster.identity.v1beta2.ApiKey.toObject, includeInstance),
nextPageToken: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysResponse}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ListApiKeysResponse;
  return proto.fonoster.identity.v1beta2.ListApiKeysResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysResponse}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.fonoster.identity.v1beta2.ApiKey;
      reader.readMessage(value,proto.fonoster.identity.v1beta2.ApiKey.deserializeBinaryFromReader);
      msg.addItems(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setNextPageToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ListApiKeysResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getItemsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.fonoster.identity.v1beta2.ApiKey.serializeBinaryToWriter
    );
  }
  f = message.getNextPageToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * repeated ApiKey items = 1;
 * @return {!Array<!proto.fonoster.identity.v1beta2.ApiKey>}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.getItemsList = function() {
  return /** @type{!Array<!proto.fonoster.identity.v1beta2.ApiKey>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.fonoster.identity.v1beta2.ApiKey, 1));
};


/**
 * @param {!Array<!proto.fonoster.identity.v1beta2.ApiKey>} value
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} returns this
*/
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.setItemsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.fonoster.identity.v1beta2.ApiKey=} opt_value
 * @param {number=} opt_index
 * @return {!proto.fonoster.identity.v1beta2.ApiKey}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.addItems = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.fonoster.identity.v1beta2.ApiKey, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.clearItemsList = function() {
  return this.setItemsList([]);
};


/**
 * optional string next_page_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.getNextPageToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ListApiKeysResponse} returns this
 */
proto.fonoster.identity.v1beta2.ListApiKeysResponse.prototype.setNextPageToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest;
  return proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyRequest.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessKeyId: jspb.Message.getFieldWithDefault(msg, 2, ""),
accessKeySecret: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse;
  return proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeyId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeySecret(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessKeyId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getAccessKeySecret();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_key_id = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.getAccessKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.setAccessKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string access_key_secret = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.getAccessKeySecret = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.RegenerateApiKeyResponse.prototype.setAccessKeySecret = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ApiKey.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ApiKey} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ApiKey.toObject = function(includeInstance, msg) {
  var f, obj = {
ref: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessKeyId: jspb.Message.getFieldWithDefault(msg, 2, ""),
role: jspb.Message.getFieldWithDefault(msg, 3, ""),
expiresAt: jspb.Message.getFieldWithDefault(msg, 4, 0),
createdAt: jspb.Message.getFieldWithDefault(msg, 5, 0),
updatedAt: jspb.Message.getFieldWithDefault(msg, 6, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ApiKey}
 */
proto.fonoster.identity.v1beta2.ApiKey.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ApiKey;
  return proto.fonoster.identity.v1beta2.ApiKey.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ApiKey} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ApiKey}
 */
proto.fonoster.identity.v1beta2.ApiKey.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRef(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeyId(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRole(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setExpiresAt(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setCreatedAt(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setUpdatedAt(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ApiKey.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ApiKey} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ApiKey.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRef();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessKeyId();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRole();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getExpiresAt();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getCreatedAt();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getUpdatedAt();
  if (f !== 0) {
    writer.writeInt32(
      6,
      f
    );
  }
};


/**
 * optional string ref = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getRef = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setRef = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_key_id = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getAccessKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setAccessKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string role = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getRole = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setRole = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 expires_at = 4;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getExpiresAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setExpiresAt = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional int32 created_at = 5;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getCreatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setCreatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int32 updated_at = 6;
 * @return {number}
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.getUpdatedAt = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.fonoster.identity.v1beta2.ApiKey} returns this
 */
proto.fonoster.identity.v1beta2.ApiKey.prototype.setUpdatedAt = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
username: jspb.Message.getFieldWithDefault(msg, 1, ""),
password: jspb.Message.getFieldWithDefault(msg, 2, ""),
twoFactorCode: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest;
  return proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setUsername(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setPassword(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setTwoFactorCode(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getUsername();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getPassword();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTwoFactorCode();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string username = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.getUsername = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.setUsername = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string password = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.getPassword = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.setPassword = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string two_factor_code = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.getTwoFactorCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsRequest.prototype.setTwoFactorCode = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
idToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessToken: jspb.Message.getFieldWithDefault(msg, 2, ""),
refreshToken: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse;
  return proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIdToken(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessToken(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefreshToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRefreshToken();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string id_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.getIdToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.setIdToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.getAccessToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.setAccessToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string refresh_token = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.getRefreshToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeCredentialsResponse.prototype.setRefreshToken = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
accessKeyId: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessKeySecret: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest;
  return proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeyId(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessKeySecret(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getAccessKeyId();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessKeySecret();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string access_key_id = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.getAccessKeyId = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.setAccessKeyId = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_key_secret = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.getAccessKeySecret = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyRequest.prototype.setAccessKeySecret = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
idToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessToken: jspb.Message.getFieldWithDefault(msg, 2, ""),
refreshToken: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse;
  return proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIdToken(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessToken(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefreshToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRefreshToken();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string id_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.getIdToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.setIdToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.getAccessToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.setAccessToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string refresh_token = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.getRefreshToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeApiKeyResponse.prototype.setRefreshToken = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
provider: jspb.Message.getFieldWithDefault(msg, 1, 0),
code: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest;
  return proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider} */ (reader.readEnum());
      msg.setProvider(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setCode(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProvider();
  if (f !== 0.0) {
    writer.writeEnum(
      1,
      f
    );
  }
  f = message.getCode();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider = {
  GITHUB: 0
};

/**
 * optional Oauth2Provider provider = 1;
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.getProvider = function() {
  return /** @type {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.Oauth2Provider} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.setProvider = function(value) {
  return jspb.Message.setProto3EnumField(this, 1, value);
};


/**
 * optional string code = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.getCode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeRequest.prototype.setCode = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
idToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessToken: jspb.Message.getFieldWithDefault(msg, 2, ""),
refreshToken: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse;
  return proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIdToken(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessToken(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefreshToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRefreshToken();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string id_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.getIdToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.setIdToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.getAccessToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.setAccessToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string refresh_token = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.getRefreshToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeOauth2CodeResponse.prototype.setRefreshToken = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
refreshToken: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest;
  return proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefreshToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRefreshToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string refresh_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.prototype.getRefreshToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenRequest.prototype.setRefreshToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
idToken: jspb.Message.getFieldWithDefault(msg, 1, ""),
accessToken: jspb.Message.getFieldWithDefault(msg, 2, ""),
refreshToken: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse;
  return proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setIdToken(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setAccessToken(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setRefreshToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIdToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAccessToken();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getRefreshToken();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string id_token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.getIdToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.setIdToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string access_token = 2;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.getAccessToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.setAccessToken = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string refresh_token = 3;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.getRefreshToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse} returns this
 */
proto.fonoster.identity.v1beta2.ExchangeRefreshTokenResponse.prototype.setRefreshToken = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RevokeTokenRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
token: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenRequest}
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RevokeTokenRequest;
  return proto.fonoster.identity.v1beta2.RevokeTokenRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenRequest}
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RevokeTokenRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenRequest} returns this
 */
proto.fonoster.identity.v1beta2.RevokeTokenRequest.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.RevokeTokenResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
token: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenResponse}
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.RevokeTokenResponse;
  return proto.fonoster.identity.v1beta2.RevokeTokenResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenResponse}
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setToken(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.RevokeTokenResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.RevokeTokenResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getToken();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string token = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.prototype.getToken = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.RevokeTokenResponse} returns this
 */
proto.fonoster.identity.v1beta2.RevokeTokenResponse.prototype.setToken = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.fonoster.identity.v1beta2.GetPublicKeyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
publicKey: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse}
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.fonoster.identity.v1beta2.GetPublicKeyResponse;
  return proto.fonoster.identity.v1beta2.GetPublicKeyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse}
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setPublicKey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.fonoster.identity.v1beta2.GetPublicKeyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPublicKey();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string public_key = 1;
 * @return {string}
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.prototype.getPublicKey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.fonoster.identity.v1beta2.GetPublicKeyResponse} returns this
 */
proto.fonoster.identity.v1beta2.GetPublicKeyResponse.prototype.setPublicKey = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * @enum {number}
 */
proto.fonoster.identity.v1beta2.ContactType = {
  EMAIL: 0,
  PHONE: 1
};

goog.object.extend(exports, proto.fonoster.identity.v1beta2);
