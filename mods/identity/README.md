<a href="https://gitpod.io/#https://github.com/fonoster/fonoster"> <img src="https://img.shields.io/badge/Contribute%20with-Gitpod-908a85?logo=gitpod" alt="Contribute with Gitpod" />

This module is part of the \[Fonoster\](https://fonoster.com) project. By itself, it does not do much. It is intended as a dependency for other modules. For more information about the project, please visit \[https://github.com/fonoster/fonoster\](https://github.com/fonoster/fonoster).a](../apiserver/README.md)

## About Identity

The Fonoster Identity Module provides the cornerstone for secure user management, authentication, and authorization within the Fonoster Ecosystem. It is designed with flexibility and scalability to accommodate the diverse and evolving needs of the various Fonoster projects.

## Key Features

This module offers comprehensive identity management functionality, including creating, reading, updating, and deleting user and group entities. Users may represent individual accounts or service accounts. Groups provide a way to organize users and streamline permission administration logically. A user can belong to multiple groups.

The Identity module ensures secure authentication by employing industry-standard JSON Web Tokens (JWTs). It supports a variety of authentication mechanisms, including username and password, Multi-Factor Authentication (MFA) for added security, OAuth2 for integration with external identity providers, and seamless token exchange to accommodate diverse scenarios.

Authorization is implemented through a Role-Based Access Control (RBAC) model, allowing for granular control over user and service actions. Predefined roles offer convenience, while the option to create custom roles provides maximum flexibility.

## Users, Groups, and Roles

Individual users or services connecting to the Identity service will require a Role. As you will see in the next section, a Role has a set of allowed actions.

Take the following example:

In the case of Fonoster, we might have the Owner, Admin, and Member as Roles associated with a Workspace (group). In such cases, the Owner will be able to perform all actions, the Admin will be allowed to perform all actions except removing the Workspace, and members will have the ability to make changes to specific resources but not be able to see billing information.

## Role-Based Access Control 

Fonoster Identity relies on Roled-Baed Access Control (RBAC) to offer granular control over parts of the system. The following pseudo-type can describe the policy for RBAC within Fonoster Identity.

```json
[ { "name": "string", "description": "string", "access": string [] } ]
```

Were the access array consist of the path for an individual gRPC function.

Policy Example:

```json
[
 	{
 		"name": "USER",
 		"description": "Access to User and Project endpoints",
 		"access": [
	 		"/fonoster.users.v1beta2.Users/ListUsers",
 			"/fonoster.users.v1beta2.Users/GetUser",
 			"/fonoster.users.v1beta2.Users/UpdateUser",
 			"/fonoster.users.v1beta2.Users/Login",
  			"/fonoster.projects.v1beta2.Projects/ListProjects",
 			"/fonoster.projects.v1beta2.Projects/CreateProject",
 			"/fonoster.projects.v1beta2.Projects/UpdateProject",
 			"/fonoster.projects.v1beta2.Projects/GetProject",
 			"/fonoster.projects.v1beta2.Projects/DeleteProject",
 		        "/fonoster.projects.v1beta2.Projects/RenewAccess",
 		       "/fonoster.limiter.v1beta2.Limiter/CheckAuthorized"
                 ]
	}
]
```

## Access and Refresh Tokens

The Identity module employs JSON Web Tokens (JWTs) for secure and flexible authentication. It strategically utilizes two distinct token types: access tokens and refresh tokens. Access tokens grant users or services access to protected resources within Fonoster services. 

They are designed to enhance security with short lifespans (e.g., minutes to an hour). Access tokens contain encoded information (claims) about the user or service, including the following

- issuer (Identity module)
- unique identifier (subject)
- intended audience
- expiration timestamp
- issued at time 
- and granted permissions (scope)

Refresh tokens have the specific function of obtaining new access tokens upon expiry. They possess longer lifespans than access tokens, potentially spanning days, weeks, or months, minimizing the frequency with which users need to re-enter their credentials. Due to their extended validity, refresh tokens warrant secure storage and careful management.

## Token Exchange

The Identity module supports a variety of mechanisms to obtain initial access and refresh tokens. A conventional method involves a user supplying their username and password in exchange for an access token and a refresh token. 

For enhanced security, the module can require Multi-Factor Authentication (MFA), where the user must provide their username, password, and a time-based MFA code. Upon successful authentication, an access token and a refresh token are issued. 

The Identity module also supports OAuth2 code exchange, enabling integration with external identity providers. In this scenario, a user authenticates with the third-party provider and receives an authorization code to exchange with the Identity module for an access and refresh token.

When an access token expires, the Identity Module facilitates seamless renewal by allowing the presentation of a valid refresh token to obtain a new access and refresh token pair. If API keys are integrated into your authentication strategy, the module could also support exchanging API keys for tokens.

## Refresh-Token Rotation Policy

A well-defined refresh token rotation policy is crucial for maintaining security. Fonoster Identity will provide a time-based refresh token, which means a refresh token will expire after a fixed amount of time.

Along with the rotation policy, the Identity module will provide a mechanism to invalidate existing refresh tokens to address scenarios like compromised devices or accounts.

## Token Verification

The Identity module utilizes the RS256 algorithm to digitally sign JWTs tokens, ensuring their authenticity and integrity. Fonoster services can verify tokens using a public key provided by the Identity module ( exposed at endpoints like /.well-known/jwks.json). 

The verification process involves two steps: first, confirming the token's signature using the correct private key, and second, validating claims such as the issuer, intended audience, and expiration time to establish the token's overall validity.

> Fonoster's SDK must provide the necessary utility to automate this process

## Security  Practices

To uphold security standards, Fonoster Identity mandates the use of HTTPS for all communications to safeguard tokens during transmission. When defining access token scopes, the principle of least privilege should be followed, granting only the minimum permissions necessary for specific tasks. Finally, comprehensive logging and monitoring of authentication events, token activities, and potential anomalies are essential for security auditing and swift incident response.
