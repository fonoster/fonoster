authz
=================

[![Authz](https://img.shields.io/badge/authz-server-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/authz.svg)](https://npmjs.org/package/@fonoster/authz)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/authz.svg)](https://npmjs.org/package/@fonoster/authz)
[![License](https://img.shields.io/npm/l/@fonoster/authz.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

Authz is a simple and extensible authorization module for Fonoster. It provides a way to authorize incoming phone and API calls. 

The module has a simple interface that allows you to create authorization strategies. That includes verifying if a session is authorized, if a GRPC method is authorized, charging an account, and getting the account balance.

The interface is defined as follows:

```typescript
type AuthzHandler = {
  checkSessionAuthorized(request: VoiceRequest): Promise<boolean>;
  checkMethodAuthorized(
    request: CheckMethodAuthorizedRequest
  ): Promise<boolean>;
  addBillingMeterEvent(request: AddBillingMeterEventRequest): Promise<void>;
};
```

Please look at the [DummyAuthzHandler](./src/server/DummyAuthzHandler.ts) for an example of implementing your authorization strategy.

## Enabling the Authz module

To enable the Authz module you need to set the `AUTHZ_SERVICE_ENABLED` environment variable to `true`. Also, you need the `AUTHZ_SERVICE_HOST` (required), `AUTHZ_SERVICE_PORT` (defaults), and `AUTHZ_SERVICE_METHODS` (default is `/fonoster.calls.v1beta2.Calls/CreateCall`) environment variables.

Imagine you want to authorize the creation of new Workspaces. You can add the `/fonoster.identity.v1beta2.Identity/CreateWorkspace` method to the `AUTHZ_SERVICE_METHODS` environment variable and implement the `checkMethodAuthorized` method in your AuthzHandler.
