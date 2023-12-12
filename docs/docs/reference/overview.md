# Overview

This API reference is valid for both the NodeJS and WebSDK with a few considerations. Both of these implementations use the same public interfaces, however, the WebSDK doesn't implement some of the methods on the `Storage` and `Funcs` APIs.

## Initializing

To initialize your API you will need the `endpoint`, `accessKeyId`, and `accessKeySecret` and pass as a parameter for the corresponding API.
> Remember to replace these values with your own

For example:

```javascript
const Fonoster = require("@fonoster/sdk")

// Init with credentials
const projects = new Fonoster.Projects({
  accessKeyId: "PJ618572e3ec11d10600000001",
  accessKeySecret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
})

// Begin using your API
projects.createProject({ ... })
  .then(console.log)
  .catc(console.error)
```

> When using the `@fonoster/websdk` your endpoint must begin with `http` or `https` since you are connecting to a REST API instead of gRPC.
