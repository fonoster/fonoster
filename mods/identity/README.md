[![Discord](https://img.shields.io/discord/1016419835455996076?color=5865F2&label=Discord&logo=discord&logoColor=white)](https://discord.gg/4QWgSz4hTC) ![GitHub](https://img.shields.io/github/license/fonoster/fonoster?color=%2347b96d) ![Twitter Follow](https://img.shields.io/twitter/follow/fonoster?style=social)

This document provides a high-level overview of the Identity module, which is helpful for maintainers, contributors, and developers who want to understand its architecture and design or contribute to it.

This module is part of the [Fonoster](https://fonoster.com) project. It does not do much by itself. It is intended to be combined with other modules to create a complete solution. For more information about the project, please visit [https://github.com/fonoster/fonoster](https://github.com/fonoster/fonoster).

<div align="center">
  <p align="center">
    <img src="https://raw.githubusercontent.com/fonoster/fonoster/0.6/assets/identity.png" />
  </p>
</div>

## About Identity

The Fonoster Identity Module provides the cornerstone for secure user management, authentication, and authorization within the Fonoster Ecosystem. It is designed with flexibility and scalability to accommodate the diverse and evolving needs of the various Fonoster projects.

## Key Features

This module offers comprehensive identity management functionality, including creating, reading, updating, and deleting user and workspace entities. Users may represent individual accounts or service accounts. Workspaces provide a way to organize users and streamline permission administration logically. A user can belong to multiple workspaces.

The Identity module ensures secure authentication by employing industry-standard JSON Web Tokens (JWTs). It supports a variety of authentication mechanisms, including username and password, Multi-Factor Authentication (MFA) for added security, OAuth2 for integration with external identity providers, and token exchange to accommodate diverse scenarios.

Authorization is implemented through a Role-Based Access Control (RBAC) model, allowing for granular control over user and service actions. Predefined roles offer convenience, while the option to create custom roles provides maximum flexibility.

## Users, Workspaces, and Roles

Individual users or services connecting to the Identity service will require a Role. As you will see in the next section, a Role has a set of allowed actions.

Take the following example:

In the case of Fonoster, we might have the Owner, Admin, and Member as Roles associated with a Workspace. In such cases, the Owner will be able to perform all actions, the Admin will be allowed to perform all actions except removing the Workspace, and members will have the ability to make changes to specific resources but not be able to see billing information.

## Resource Ownership

All resources created within Fonoster have an owner. The owner may be a user or a workspace. For example, a user may own a workspace/workspace, and a workspace can own applications, phone numbers, domains, etc.

Creating a resource within a workspace automatically marks it with the workspace's identifier (the accessKeyId). 

> The `accessKeyId` for a user always starts with the prefix `US`, while the `accessKeyId` for a workspace starts with the prefix `WO`, which helps identify the resource owner type.

## Role-Based Access Control 

Fonoster Identity relies on Role-Based Access Control (RBAC) to offer granular control over parts of the system. The following type can describe the policy for RBAC within Fonoster Identity.

```typescript
[ { "name": "string", "description": "string", "access": string [] } ]
```

The access array consists of the path for an individual gRPC function.

Policy Example:

```json
{
  "name": "user",
  "description": "Access to User and Workspace endpoints",
  "access": [
    "/fonoster.identity.v1beta2.Identity/GetUser",
    "/fonoster.identity.v1beta2.Identity/UpdateUser",
    "/fonoster.identity.v1beta2.Identity/DeleteUser",
    "/fonoster.identity.v1beta2.Identity/CreateWorkspace",
    "/fonoster.identity.v1beta2.Identity/GetWorkspace",
    "/fonoster.identity.v1beta2.Identity/UpdateWorkspace",
    "/fonoster.identity.v1beta2.Identity/ListWorkspaces",
    "/fonoster.identity.v1beta2.Identity/RefreshToken",
    // Additional access here
  ]
}
```

## ID, Access, and Refresh Tokens

The Identity module employs JSON Web Tokens (JWTs) for secure and flexible authentication. It strategically utilizes three types of tokens: ID, access, and refresh. Each token type serves a distinct purpose in the authentication process.

ID tokens identify the user and contain information about their identity. Typically short-lived, issued upon successful authentication. The following is an example of an ID token:

```json
{
  "iss": "https://identity-global.fonoster.com",
  "sub": "00000000-0000-0000-0000-000000000000",
  "aud": "api",
  "tokenUse": "id",
  "accessKeyId": "US00000000000000000000000000000000",
  "email": "johndoe@example.com",
  "emailVerified": false,
  "phoneNumber": null,
  "phoneNumberVerified": false,
  "iat": 1723477780,
  "exp": 1723478680
}

```

Access tokens enhance security with short lifespans (e.g., minutes to an 15m). They contain claims about the user or service, represented as a JSON object. The following is an example of an access token:

```json
{
  "iss": "https://identity-global.fonoster.com",
  "sub": "00000000-0000-0000-0000-000000000000",
  "aud": "api",
  "tokenUse": "access",
  "accessKeyId": "US00000000000000000000000000000000",
  "access": [
    {
      "accessKeyId": "WO00000000000000000000000000000000",
      "role": "OWNER"
    }
  ],
  "iat": 1723477780,
  "exp": 1723478680
}
```

Here, `sub` is the user identifier, `aud` is the intended audience, and `access` contains a list of workspaces and their associated roles.

Refresh tokens have the specific function of obtaining new access tokens upon expiry. They possess longer lifespans than access tokens, potentially spanning days, weeks, or months, minimizing the frequency with which users need to re-enter their credentials. Due to their extended validity, refresh tokens warrant secure storage and careful management.

By default, refresh tokens are issued with a 24-hour expiration time. You can adjust this value to suit your security requirements.

An example of a refresh token:

```json
{
  "iss": "https://identity-global.fonoster.com",
  "sub": "00000000-0000-0000-0000-000000000000",
  "aud": "api",
  "tokenUse": "refresh",
  "accessKeyId": "US00000000000000000000000000000000",
  "iat": 1723477780,
  "exp": 1723564180
}
```

Like the access token, the `sub` is the user identifier, the `aud` is the intended audience.

## Token Exchange

The Identity module supports a variety of mechanisms to obtain initial access and refresh tokens. A conventional method involves a user supplying their username and password in exchange for an access token and a refresh token. 

The module can enforce Multi-Factor Authentication (MFA) for enhanced security, requiring users to provide their username, password, and a time-based MFA code. Upon successful authentication, the module issues an access token and a refresh token.

The Identity module also supports OAuth2 code exchange, enabling integration with external identity providers. In this scenario, a user authenticates with the third-party provider and receives an authorization code to exchange with the Identity module for an access and refresh token.

The Identity Module simplifies the renewal process for expired access tokens. Users present a valid refresh token to receive a new access and refresh token pair. If your authentication strategy includes API keys, the module can also facilitate exchanging them for tokens.

## Refresh-Token Rotation Policy

Fonoster Identity uses a time-based refresh token, which means a refresh token will expire after a fixed amount of time. The Identity service must provide a mechanism to invalidate existing refresh tokens to address scenarios like compromised devices or accounts.

## Token Verification

The Identity module employs the RS256 algorithm to sign JWTs, guaranteeing their authenticity and integrity. A system can retrieve the public key from the issuer's `fonoster.identity.v1beta2.Identity.GetPublicKey` gRPC endpoint and use it to validate a token.

The verification process involves two steps: first, confirming the token's signature using the correct private key, and second, validating claims such as the issuer, intended audience, and expiration time to establish the token's overall validity.

> Fonoster's SDK must provide the necessary utility to automate this process

## Security Practices

To uphold security standards, Fonoster Identity mandates using HTTPS in all communications to safeguard tokens during transmission. We apply the principle of least privilege by granting tokens only the minimum permissions necessary to perform a specific task. We maintain comprehensive logging and monitoring of authentication events, token activities, and potential anomalies, essential for security auditing and swift incident response.
