[<a href="https://gitpod.io/#https://github.com/fonoster/fonoster"> <img src="https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod" alt="Contribute with Gitpod" />

This module is part of the \[Fonoster\](https://fonoster.com) project. By itself, it does not do much. It is intended to be used as a dependency for other modules. For more information about the project, please visit \[https://github.com/fonoster/fonoster\](https://github.com/fonoster/fonoster).a](../apiserver/README.md)

## About the Identity Module

The Identity module is a set of tools to manage users, groups, and permissions. The module is generic enough to be used in other projects within Fonoster Ecosystem. 

In general terms, the module provides the mecanisms to sign up, sign in, and manage users and groups. It also provides a way to manage permissions and roles for users and groups.

This modules makes use of the public/private key pair to sign and verify JWT tokens using the RS256 algorithm. This tokens can be use to access other services within the Fonoster Ecosystem and might be obtained by exchanging a username and password, a refresh token, or ouath2 code.

Here are the main features of the module:

- **Identity Management**: Manage users, groups, and permissions
- **Authentication**: Authenticate users using JWT
- **Authorization**: Authorize users using RBAC

In this document, we will capture the concepts and guidelines for the Identity module.

## About Users and Groups

The module is designed to work with users and groups. A user can belong to one or more groups. The group owns the resources and the permissions. A user can have different roles in different groups.

[Diagram showing relationship between users, groups, and permissions]

Available roles include:

- **Admin**: Can manage all resources and permissions
- **Member**: Can access SIPNet, Apps, and SMS APIs

> While members will have access to monitoring they will not be able to open recordings.

## Role-Based Access Control

The module uses Role-Based Access Control (RBAC) to manage permissions. RBAC is a policy neutral access control mechanism defined around roles and privileges. The components of RBAC such as role-permissions, user-role, and role-role relationships make it simple to perform user assignments.

```json
[
  {
    "name": "USER",
    "description": "Access to User and Project endpoints",
    "access": [
      "/fonoster.users.v1beta1.Users/ListUsers",
      "/fonoster.users.v1beta1.Users/GetUser",
      "/fonoster.users.v1beta1.Users/UpdateUser",
      "/fonoster.users.v1beta1.Users/Login",
      "/fonoster.projects.v1beta1.Projects/ListProjects",
      "/fonoster.projects.v1beta1.Projects/CreateProject",
      "/fonoster.projects.v1beta1.Projects/UpdateProject",
      "/fonoster.projects.v1beta1.Projects/GetProject",
      "/fonoster.projects.v1beta1.Projects/DeleteProject",
      "/fonoster.projects.v1beta1.Projects/RenewAccessKeySecret",
      "/fonoster.limiter.v1beta1.Limiter/CheckAuthorized"
    ]
  },
  {
    "name": "PROJECT",
    "description": "Access to Project resources",
    "access": [
      "/fonoster.apps.v1beta1.Apps/ListApps",
      "/fonoster.apps.v1beta1.Apps/CreateApp",
      "/fonoster.apps.v1beta1.Apps/GetApp",
      "/fonoster.apps.v1beta1.Apps/UpdateApp",
      "/fonoster.apps.v1beta1.Apps/DeleteApp",
      "/fonoster.monitor.v1beta1.Monitor/SearchEvents",
      "/fonoster.storage.v1beta1.Storage/UploadObject",
      "/fonoster.storage.v1beta1.Storage/GetObjectURL",
      "/fonoster.providers.v1beta1.Providers/ListProviders",
      "/fonoster.providers.v1beta1.Providers/CreateProvider",
      "/fonoster.providers.v1beta1.Providers/GetProvider",
      "/fonoster.providers.v1beta1.Providers/UpdateProvider",
      "/fonoster.providers.v1beta1.Providers/DeleteProvider",
      "/fonoster.numbers.v1beta1.Numbers/ListNumbers",
      "/fonoster.numbers.v1beta1.Numbers/CreateNumber",
      "/fonoster.numbers.v1beta1.Numbers/GetIngressInfo",
      "/fonoster.numbers.v1beta1.Numbers/GetNumber",
      "/fonoster.numbers.v1beta1.Numbers/UpdateNumber",
      "/fonoster.numbers.v1beta1.Numbers/DeleteNumber",
      "/fonoster.domains.v1beta1.Domains/ListDomains",
      "/fonoster.domains.v1beta1.Domains/CreateDomain",
      "/fonoster.domains.v1beta1.Domains/GetDomain",
      "/fonoster.domains.v1beta1.Domains/UpdateDomain",
      "/fonoster.domains.v1beta1.Domains/DeleteDomain",
      "/fonoster.callmanager.v1beta1.CallManager/Call",
      "/fonoster.agents.v1beta1.Agents/ListAgents",
      "/fonoster.agents.v1beta1.Agents/CreateAgent",
      "/fonoster.agents.v1beta1.Agents/GetAgent",
      "/fonoster.agents.v1beta1.Agents/UpdateAgent",
      "/fonoster.agents.v1beta1.Agents/DeleteAgent",
      "/fonoster.secrets.v1beta1.Secrets/CreateSecret",
      "/fonoster.secrets.v1beta1.Secrets/ListSecretsId",
      "/fonoster.secrets.v1beta1.Secrets/DeleteSecret",
      "/fonoster.secrets.v1beta1.Secrets/GetSecret",
      "/fonoster.limiter.v1beta1.Limiter/CheckAuthorized"
    ]
  }
  {
    "name": "SERVICE",
    "description": "This role is able to obtain ingress information and create short-live token",
    "access": [
      "/fonoster.numbers.v1beta1.Numbers/GetIngressInfo",
      "/fonoster.auth.v1beta1.Auth/CreateToken",
      "/fonoster.auth.v1beta1.Auth/CreateNoAccessToken",
      "/fonoster.auth.v1beta1.Auth/ValidateToken",
      "/fonoster.users.v1beta1.Users/CreateUser",
      "/fonoster.users.v1beta1.Users/ListUsers",
      "/fonoster.users.v1beta1.Users/UpdateUser"
    ]
  },
  {
    "name": "NO_ACCESSS",
    "description": "Signature token without any access",
    "access": []
  },
  {
    "name": "ADMIN",
    "description": "Can perform administrative task",
    "access": [
      "/fonoster.auth.v1beta1.Auth/CreateToken",
      "/fonoster.users.v1beta1.Users/CreateUser",
      "/fonoster.users.v1beta1.Users/DeleteUser",
      "/fonoster.users.v1beta1.Users/ListUsers",
      "/fonoster.users.v1beta1.Users/UpdateUser"
    ]
  }
]
```

## Access and Refresh Tokens

(Talk about the difference between access and refresh tokens, claims, scopes, duration, refresh token rotation policy, etc.)

The module uses JWT to manage access and refresh tokens. The access token is used to access the services, and the refresh token is used to obtain a new access token when the current one expires. The access token is short-lived, and the refresh token is long-lived??. 

## Token Exchange

For a user to obtain a token, the user must provide a username and password. The user will receive an access token and a refresh token. The access token is used to access the services, and the refresh token is used to obtain a new access token when the current one expires.

When the MFA is enabled, the user must provide the username and password and the MFA code. The user will receive an access token and a refresh token. The access token is used to access the services, and the refresh token is used to obtain a new access token when the current one expires.

When the user has a refresh token, the user can obtain a new access token by providing the refresh token. The user will receive a new access token and a new refresh token.

When the user has an oauth2 code, the user can obtain a new access token by providing the oauth2 code. The user will receive a new access token and a new refresh token.

When the user has a token, the user can obtain a new access token by providing the token. The user will receive a new access token and a new refresh token.

When the user has an API key, the user can obtain a new access token by providing the API key. The user will receive a new access token and a new refresh token.

(Look into other implementations for refresh token rotation policy)

> The Fonoster SDK must provide the necessary mecanism to refresh the token.

## Token Verification

(Talk about how to use the public key to verify the token)

The module uses the RS256 algorithm to sign and verify JWT tokens. Services within a Fonoster instance can verify the token by using the public key provided by the Identity module. The public key is available at the `/.well-known/jwks.json` endpoint for Restful services and at the `jwks` endpoint for gRPC services.


