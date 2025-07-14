sdk
=================

[![Fonoster](https://img.shields.io/badge/fonoster-sdk-brightgreen.svg)](https://fonoster.com)
[![Version](https://img.shields.io/npm/v/@fonoster/sdk.svg)](https://npmjs.org/package/@fonoster/sdk)
[![Downloads/week](https://img.shields.io/npm/dw/@fonoster/sdk.svg)](https://npmjs.org/package/@fonoster/sdk)
[![License](https://img.shields.io/npm/l/@fonoster/sdk.svg)](https://github.com/fonoster/fonoster/blob/main/package.json)

This package provides a set of utilities for working with Fonoster services. It is a polymorphic SDK that can be used in a browser or a Node.js environment.

* [Installation](#installation)
* [Example](#example)
* [APIs](#apis)

## Installation

```sh-session
$ npm install --save @fonoster/sdk
```

Or using yarn:

```sh-session
$ yarn add @fonoster/sdk
```

Or in the browser:

```html
<script src="https://unpkg.com/@fonoster/sdk"></script>
```

### Importing the library

For CommonJS projects:

```typescript
const SDK = require("@fonoster/sdk");
```

For ES6 modules:

```typescript
import * as SDK from "@fonoster/sdk";
```

Directly in the browser:

```html
<script src="https://unpkg.com/@fonoster/sdk"></script>
<script>
   // You can now use the SDK
</script>
```

## Example

Create a new SDK instance to interact with the Fonoster API. The SDK requires a client object to handle communication with the API.

### Creating a client object

In Node.js:

```typescript
const SDK = require("@fonoster/sdk");
const ACCESS_KEY_ID = "WO00000000000000000000000000000000";
const ENDPOINT = "api.fonoster.com";
const client = new SDK.Client({ accessKeyId: ACCESS_KEY_ID, endpoint: ENDPOINT });
```

When connecting to Fonoster's cloud services, you can omit the `endpoint` parameter.

In the browser:

```typescript
const SDK = require("@fonoster/sdk");
const ACCESS_KEY_ID = "WO00000000000000000000000000000000";
const URL = "https://api.fonoster.com/v1beta2";
const client = new SDK.WebClient({ accessKeyId: ACCESS_KEY_ID, url: URL });
```

When connecting to Fonoster's cloud services, you can omit the `url` parameter.

### Login in and make requests

```typescript
const username = "admin@fonoster.local";
const password = "changeme";

async function main() {
  await client.login(username, password);
  const applications = new SDK.Applications(client);
  await applications.createApplication({
    name: "MyApp",
    type: "EXTERNAL",
    endpoint: "localhost:50061" // Your app's endpoint
 });
}

main().catch(console.error);
```

In addition to the `login` method, the SDK provides a `loginWithApiKey` and `loginWithRefreshToken` methods. The `loginWithRefreshToken` is helpful in browser environments where you want to keep the user logged in between sessions.

The SDK will automatically refresh the token when it expires.

## APIs

* [`Applications`](#Applications)
* [`Acls`](#Acls)
* [`Agents`](#Agents)
* [`ApiKeys`](#ApiKeys)
* [`Calls`](#Calls)
* [`Credentials`](#Credentials)
* [`Domains`](#Domains)
* [`Numbers`](#Numbers)
* [`Secrets`](#Secrets)
* [`Trunks`](#Trunks)
* [`Users`](#Users)
* [`Workspaces`](#Workspaces)


<a name="Acls"></a>

## Acls
Fonoster Acls, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete Access Control Lists (ACLs) rules for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Acls](#Acls)
    * [new Acls(client)](#new_Acls_new)
    * [.createAcl(request)](#Acls+createAcl) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getAcl(ref)](#Acls+getAcl) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateAcl(request)](#Acls+updateAcl) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listAcls(request)](#Acls+listAcls) ⇒ <code>Promise.&lt;ListAclsResponse&gt;</code>
    * [.deleteAcl(ref)](#Acls+deleteAcl) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Acls_new"></a>

### new Acls(client)
Constructs a new Acls object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const acls = new SDK.Acls(client);
    const response = await acls.createAcl(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My ACL",
  allow: ["47.132.130.31"] // Allow only this IP
};

main(request);
```
<a name="Acls+createAcl"></a>

### acls.createAcl(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Acl in the Workspace.

**Kind**: instance method of [<code>Acls</code>](#Acls)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Acl  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAclRequest</code> | The request object that contains the necessary information to create a new Acl |
| request.name | <code>string</code> | The name of the Acl |
| request.allow | <code>Array.&lt;string&gt;</code> | The list of IPs to allow |

**Example**  
```js
const acls = new SDK.Acls(client); // Existing client object

const request = {
  name: "My ACL",
  allow: ["47.132.130.31"] // Allow only this IP
};

acls
  .createAcl(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Acls+getAcl"></a>

### acls.getAcl(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Acl in the Workspace.

**Kind**: instance method of [<code>Acls</code>](#Acls)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Acl information  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Acl to retrieve |

**Example**  
```js
const acls = new SDK.Acls(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

acls
  .getAcl(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Acls+updateAcl"></a>

### acls.updateAcl(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Acl in the Workspace.

**Kind**: instance method of [<code>Acls</code>](#Acls)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Acl  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAclRequest</code> | The request object that contains the necessary information to update an existing Acl |
| request.ref | <code>string</code> | The reference of the Acl to update |
| request.name | <code>string</code> | The name of the Acl |
| request.allow | <code>Array.&lt;string&gt;</code> | The list of IPs to allow |

**Example**  
```js
const acls = new SDK.Acls(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My ACL",
  allow: ["47.132.130.31"] // Allow only this IP
};

acls
  .updateAcl(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Acls+listAcls"></a>

### acls.listAcls(request) ⇒ <code>Promise.&lt;ListAclsResponse&gt;</code>
Retrieves a list of Acls from a Workspace.

**Kind**: instance method of [<code>Acls</code>](#Acls)  
**Returns**: <code>Promise.&lt;ListAclsResponse&gt;</code> - - The response object that contains the list of Acls  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAclsRequest</code> | The request object that contains the necessary information to retrieve a list of Acls |
| request.pageSize | <code>number</code> | The number of Acls to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Acls |

**Example**  
```js
const acls = new SDK.Acls(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

acls
  .listAcls(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Acls+deleteAcl"></a>

### acls.deleteAcl(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Acl from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Acls</code>](#Acls)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Acl  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Acl to delete |

**Example**  
```js
const acls = new SDK.Acls(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

acls
  .deleteAcl(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Agents"></a>

## Agents
Fonoster Agents, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Agents for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Agents](#Agents)
    * [new Agents(client)](#new_Agents_new)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Agents_new"></a>

### new Agents(client)
Constructs a new Agents object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const agents = new SDK.Agents(client);
    const response = await agents.createAgent(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "John Doe",
  username: "1001",
  privacy: "PRIVATE",
  enabled: true,
  maxContacts: 3
  domainRef: "00000000-0000-0000-0000-000000000000"
};

main(request);
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Agent in the Workspace.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Agent  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAgentRequest</code> | The request object that contains the necessary information to create a new Agent |
| request.name | <code>string</code> | The name of the Agent |
| request.username | <code>string</code> | The username of the Agent |
| request.privacy | <code>Privacy</code> | The privacy of the Agent |
| request.enabled | <code>boolean</code> | The status of the Agent |
| request.maxContacts | <code>number</code> | The maximum number of contacts the Agent can have |
| request.domainRef | <code>string</code> | The reference of the Domain to associate the Agent |

**Example**  
```js
const agents = new SDK.Agents(client); // Existing client object

const request = {
  name: "John Doe",
  username: "1001",
  privacy: "PRIVATE",
  enabled: true,
  maxContacts: 3
  domainRef: "00000000-0000-0000-0000-000000000000"
};

agents
  .createAgent(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Agent in the Workspace.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Agent information  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Agent to retrieve |

**Example**  
```js
const agents = new SDK.Agents(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

agents
  .getAgent(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Agent in the Workspace.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Agent  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAgentRequest</code> | The request object that contains the necessary information to update an existing Agent |
| request.ref | <code>string</code> | The reference of the Agent to update |
| request.name | <code>string</code> | The name of the Agent |
| request.privacy | <code>Privacy</code> | The privacy of the Agent |
| request.enabled | <code>boolean</code> | The status of the Agent |
| request.maxContacts | <code>number</code> | The maximum number of contacts the Agent can have |
| request.domainRef | <code>string</code> | The reference of the Domain to associate the Agent |

**Example**  
```js
const agents = new SDK.Agents(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "John Doe",
  privacy: "PRIVATE",
  enabled: true,
  maxContacts: 3
  domainRef: "00000000-0000-0000-0000-000000000000"
};

agents
  .updateAgent(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
Retrieves a list of Agents from a Workspace.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - - The response object that contains the list of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAgentsRequest</code> | The request object that contains the necessary information to retrieve a list of Agents |
| request.pageSize | <code>number</code> | The number of Agents to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Agents |

**Example**  
```js
const agents = new SDK.Agents(client); // Existing client object

const request = {
 pageSize: 10,
 pageToken: "00000000-0000-0000-0000-000000000000"
};

agents
  .listAgents(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Agents+deleteAgent"></a>

### agents.deleteAgent(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Agent from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Agent  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Agent to delete |

**Example**  
```js
const agents = new SDK.Agents(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

agents
  .deleteAgent(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="ApiKeys"></a>

## ApiKeys
Fonoster ApiKeys, part of the Fonoster Identity subsystem,
allows you to create, update, retrieve, and delete ApiKeys for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [ApiKeys](#ApiKeys)
    * [new ApiKeys(client)](#new_ApiKeys_new)
    * [.createApiKey(request)](#ApiKeys+createApiKey) ⇒ <code>Promise.&lt;CreateApiKeyResponse&gt;</code>
    * [.regenerateApiKey(ref)](#ApiKeys+regenerateApiKey) ⇒ <code>Promise.&lt;CreateApiKeyResponse&gt;</code>
    * [.listApiKeys(request)](#ApiKeys+listApiKeys) ⇒ <code>Promise.&lt;ListApiKeysResponse&gt;</code>
    * [.deleteApiKey(ref)](#ApiKeys+deleteApiKey) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_ApiKeys_new"></a>

### new ApiKeys(client)
Constructs a new ApiKeys object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const apiKeys = new SDK.ApiKeys(client);
    const response = await apiKeys.createApiKey(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  role: "WORKSPACE_ADMIN"
};

main(request);
```
<a name="ApiKeys+createApiKey"></a>

### apiKeys.createApiKey(request) ⇒ <code>Promise.&lt;CreateApiKeyResponse&gt;</code>
Creates a new ApiKey for a Workspace.

**Kind**: instance method of [<code>ApiKeys</code>](#ApiKeys)  
**Returns**: <code>Promise.&lt;CreateApiKeyResponse&gt;</code> - - The response object that contains the reference to the created ApiKey  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateApiKeyRequest</code> | The request object that contains the necessary information to create a new ApiKey |
| request.role | <code>Role</code> | The role of the ApiKey |

**Example**  
```js
const apiKeys = new SDK.ApiKeys(client); // Existing client object

const request = {
  role: "WORKSPACE_ADMIN"
};

apiKeys
  .createApiKey(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="ApiKeys+regenerateApiKey"></a>

### apiKeys.regenerateApiKey(ref) ⇒ <code>Promise.&lt;CreateApiKeyResponse&gt;</code>
Regenerates an existing ApiKey for a Workspace.
Note that this operation is irreversible.

**Kind**: instance method of [<code>ApiKeys</code>](#ApiKeys)  
**Returns**: <code>Promise.&lt;CreateApiKeyResponse&gt;</code> - - The response object that contains the reference to the regenerated ApiKey  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the ApiKey to regenerate |

**Example**  
```js
const apiKeys = new SDK.ApiKeys(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

apiKeys
  .regenerateApiKey(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="ApiKeys+listApiKeys"></a>

### apiKeys.listApiKeys(request) ⇒ <code>Promise.&lt;ListApiKeysResponse&gt;</code>
Retrieves a list of ApiKeys from a Workspace.

**Kind**: instance method of [<code>ApiKeys</code>](#ApiKeys)  
**Returns**: <code>Promise.&lt;ListApiKeysResponse&gt;</code> - - The response object that contains the list of ApiKeys  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListApiKeysRequest</code> | The request object that contains the necessary information to retrieve a list of ApiKeys |
| request.pageSize | <code>number</code> | The number of ApiKeys to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of ApiKeys |

**Example**  
```js
const apiKeys = new SDK.ApiKeys(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

apiKeys
  .listApiKeys(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="ApiKeys+deleteApiKey"></a>

### apiKeys.deleteApiKey(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing ApiKey from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>ApiKeys</code>](#ApiKeys)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted ApiKey  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the ApiKey to delete |

**Example**  
```js
const apiKeys = new SDK.ApiKeys(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

apiKeys
  .deleteApiKey(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Applications"></a>

## Applications
Fonoster Applications, part of the Fonoster Voice Subsystem,
allow you to create, update, retrieve, and delete Voice Applications.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Applications](#Applications)
    * [new Applications(client)](#new_Applications_new)
    * [.createApplication(request)](#Applications+createApplication) ⇒ <code>Promise.&lt;CreateAppResponse&gt;</code>
    * [.getApplication(ref)](#Applications+getApplication) ⇒ <code>Promise.&lt;Application&gt;</code>
    * [.updateApplication(request)](#Applications+updateApplication) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listApplications(request)](#Applications+listApplications) ⇒ <code>Promise.&lt;ListApplicationsResponse&gt;</code>
    * [.deleteApplication(ref)](#Applications+deleteApplication) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.evaluateIntelligence(request)](#Applications+evaluateIntelligence) ⇒ <code>Promise.&lt;ScenarioEvaluationReport&gt;</code>

<a name="new_Applications_new"></a>

### new Applications(client)
Constructs a new Applications object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const apps = new SDK.Applications(client);
    const response = await apps.createApplication(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My application",
  type: "EXTERNAL",
  endpoint: "welcome.demo.fonoster.local", // Built-in demo application
  speechToText: {
    productRef: "stt.deepgram",
    config: {
      model: "nova-2",
      languageCode: "en-US"
    }
  },
  textToSpeech: {
    productRef: "tts.elevenlabs",
    config: {
      voice: "lrTWbMInQjSJ9q5ywFKP"
    }
  }
};

main(request);
```
<a name="Applications+createApplication"></a>

### applications.createApplication(request) ⇒ <code>Promise.&lt;CreateAppResponse&gt;</code>
Creates a new Application in Fonoster. The only required fields are the name and type of the application.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;CreateAppResponse&gt;</code> - - The response object that contains the reference to the newly created application  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateApplicationRequest</code> | The request object that contains the necessary information to create a new application |
| request.name | <code>string</code> | The name of the application |
| request.type | <code>ApplicationType</code> | The type of application (e.g., EXTERNAL) |
| request.endpoint | <code>string</code> | The endpoint where the application is hosted |
| request.speechToText | <code>SpeechToText</code> | The speech-to-text configuration |
| request.speechToText.productRef | <code>string</code> | The product reference of the speech-to-text engine (e.g., stt.deepgram) |
| request.speechToText.config | <code>object</code> | The configuration object for the speech-to-text engine (e.g., { model: "nova-2", languageCode: "en-US" }) |
| request.textToSpeech | <code>TextToSpeech</code> | The text-to-speech configuration |
| request.textToSpeech.productRef | <code>string</code> | The product reference of the text-to-speech engine (e.g., tts.elevenlabs) |
| request.textToSpeech.config | <code>object</code> | The configuration object for the text-to-speech engine (e.g., { voice: "lrTWbMInQjSJ9q5ywFKP" }) |
| request.intelligence | <code>Intelligence</code> | The intelligence configuration |
| request.intelligence.productRef | <code>string</code> | The product reference of the intelligence engine (e.g., llm.groq) |
| request.intelligence.config | <code>object</code> | The configuration object for the intelligence engine |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const request = {
  name: "My application",
  type: "EXTERNAL",
  endpoint: "welcome.demo.fonoster.local", // Built-in demo application
  speechToText: {
    productRef: "stt.deepgram",
    config: {
      languageCode: "en-US"
    }
  },
  textToSpeech: {
    productRef: "tts.elevenlabs",
    config: {
      voice: "lrTWbMInQjSJ9q5ywFKP"
    }
  }
};

apps
  .createApplication(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Applications+getApplication"></a>

### applications.getApplication(ref) ⇒ <code>Promise.&lt;Application&gt;</code>
Retrieves an existing Application in the Workspace.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;Application&gt;</code> - - The response object that contains the Application information  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Application to retrieve |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

apps
  .getApplication(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Applications+updateApplication"></a>

### applications.updateApplication(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing application in Fonoster.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated application  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateApplicationRequest</code> | The request object that contains the necessary information to update an application |
| request.ref | <code>string</code> | The reference of the application to update |
| request.name | <code>string</code> | The name of the application |
| request.endpoint | <code>string</code> | The endpoint where the application is hosted |
| request.speechToText | <code>SpeechToText</code> | The speech-to-text configuration |
| request.speechToText.productRef | <code>string</code> | The product reference of the speech-to-text engine (e.g., stt.deepgram) |
| request.speechToText.config | <code>object</code> | The configuration object for the speech-to-text engine (e.g., { model: "nova-2", languageCode: "en-US" }) |
| request.textToSpeech | <code>TextToSpeech</code> | The text-to-speech configuration |
| request.textToSpeech.productRef | <code>string</code> | The product reference of the text-to-speech engine (e.g., tts.elevenlabs) |
| request.textToSpeech.config | <code>object</code> | The configuration object for the text-to-speech engine (e.g., { voice: "lrTWbMInQjSJ9q5ywFKP" }) |
| request.intelligence | <code>Intelligence</code> | The intelligence configuration |
| request.intelligence.productRef | <code>string</code> | The product reference of the intelligence engine (e.g., llm.groq) |
| request.intelligence.config | <code>object</code> | The configuration object for the intelligence engine |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My application",
  endpoint: "welcome.demo.fonoster.local", // Built-in demo application
};

apps
  .updateApplication(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Applications+listApplications"></a>

### applications.listApplications(request) ⇒ <code>Promise.&lt;ListApplicationsResponse&gt;</code>
Retrieves a list of Applications from Fonoster.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;ListApplicationsResponse&gt;</code> - - The response object that contains the list of Applications  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListApplicationsRequest</code> | The request object that contains the necessary information to retrieve a list of Applications |
| request.pageSize | <code>number</code> | The number of Applications to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Applications |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

apps
  .listApplications(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Applications+deleteApplication"></a>

### applications.deleteApplication(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Application from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted application  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Application to delete |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

apps
  .deleteApplication(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Applications+evaluateIntelligence"></a>

### applications.evaluateIntelligence(request) ⇒ <code>Promise.&lt;ScenarioEvaluationReport&gt;</code>
Evaluates the intelligence of an application.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;ScenarioEvaluationReport&gt;</code> - - The response object that contains the evaluation report  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>EvaluateIntelligenceRequest</code> | The request object that contains the necessary information to evaluate the intelligence of an application |
| request.intelligence.productRef | <code>string</code> | The product reference of the intelligence engine (e.g., llm.groq) |
| request.intelligence.config | <code>object</code> | The configuration object for the intelligence engine |

**Example**  
```js
const apps = new SDK.Applications(client); // Existing client object

const request = {
  intelligence: {
    productRef: "llm.groq",
    config: {
      conversationSettings: {
        firstMessage: "Hello, how can I help you today?",
        systemPrompt: "You are a helpful assistant.",
        systemErrorMessage: "I'm sorry, I didn't catch that. Can you say that again?",
        goodbyeMessage: "Thank you for calling. Have a great day!",
        languageModel: {
          provider: "openai",
          model: "gpt-4o"
        },
        testCases: {
          evalsLanguageModel: {
            provider: "openai",
            model: "gpt-4o"
          },
          scenarios: [
            {
              ref: "Scenario 1",
              description: "Scenario 1 description",
              telephonyContext: {
                callDirection: "FROM_PSTN",
                ingressNumber: "1234567890",
                callerNumber: "1234567890"
              },
              conversation: [
                {
                  userInput: "Hello, how can I help you today?",
                  expected: {
                    text: {
                      type: "EXACT",
                      response: "Hello, how can I help you today?"
                    }
                  }
                }
              ]
            }
          ]
        }
      }
    }
  }
};

apps
  .evaluateIntelligence(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Calls"></a>

## Calls
Fonoster Calls, part of the Fonoster Media subsystem,
allows you to create, list, and track calls in your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Calls](#Calls)
    * [new Calls(client)](#new_Calls_new)
    * [.createCall(request)](#Calls+createCall) ⇒ <code>Object</code>
    * [.getCall(ref)](#Calls+getCall) ⇒ <code>Promise.&lt;CallDetailRecord&gt;</code>
    * [.listCalls(request)](#Calls+listCalls) ⇒ <code>Promise.&lt;ListCallsResponse&gt;</code>

<a name="new_Calls_new"></a>

### new Calls(client)
Constructs a new Calls object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const calls = new SDK.Calls(client);
    const response = await calls.createCall(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  from: "+18287854037",
  to: "+17853178070",
  appRef: "00000000-0000-0000-0000-000000000000"
};

main(request);
```
<a name="Calls+createCall"></a>

### calls.createCall(request) ⇒ <code>Object</code>
Creates a new Call in the Workspace.

**Kind**: instance method of [<code>Calls</code>](#Calls)  
**Returns**: <code>Object</code> - - The response object that contains the Call reference and a stream of status updates  
**See**: DialStatus  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateCallRequest</code> | The request object that contains the necessary information to create a new Call |
| request.from | <code>string</code> | The number that originated the call |
| request.to | <code>string</code> | The number that received the call |
| request.appRef | <code>string</code> | The reference of the App that will handle the call |
| request.timeout | <code>number</code> | The time in seconds to wait for the call to be answered. Default is 60 seconds |
| request.metadata | <code>Record.&lt;string, string&gt;</code> | Optional metadata to be sent to the App. For Autopilot applications, this is added to the context of the conversation. |

**Example**  
```js
const calls = new SDK.Calls(client); // Existing client object

const request = {
  from: "+18287854037",
  to: "+17853178070",
  appRef: "00000000-0000-0000-0000-000000000000",
  timeout: 30,
  metadata: {
    "name": "John Doe",
    "preferredLanguage": "en-US"
  }
};

const response = await calls.createCall(request);
const { ref, statusStream } = response;

console.log(ref); // Call reference

for await (const status of statusStream) {
 console.log(status); // Streamed status
}
```
<a name="Calls+getCall"></a>

### calls.getCall(ref) ⇒ <code>Promise.&lt;CallDetailRecord&gt;</code>
Retrieves an existing Call in the Workspace.

**Kind**: instance method of [<code>Calls</code>](#Calls)  
**Returns**: <code>Promise.&lt;CallDetailRecord&gt;</code> - - The response object that contains the Call detail  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Call to retrieve |

**Example**  
```js
const calls = new SDK.Calls(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

calls
  .getCall(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Calls+listCalls"></a>

### calls.listCalls(request) ⇒ <code>Promise.&lt;ListCallsResponse&gt;</code>
Retrieves a list of Calls from a Workspace.

**Kind**: instance method of [<code>Calls</code>](#Calls)  
**Returns**: <code>Promise.&lt;ListCallsResponse&gt;</code> - - The response object that contains the list of Calls  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListCallsRequest</code> | The request object that contains the necessary information to retrieve a list of Calls |
| request.pageSize | <code>number</code> | The number of Calls to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Calls |

**Example**  
```js
const calls = new SDK.Calls(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

calls
  .listCalls(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Credentials"></a>

## Credentials
Fonoster Credentials, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Credentials for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Credentials](#Credentials)
    * [new Credentials(client)](#new_Credentials_new)
    * [.createCredentials(request)](#Credentials+createCredentials) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getCredentials(ref)](#Credentials+getCredentials) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateCredentials(request)](#Credentials+updateCredentials) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listCredentials(request)](#Credentials+listCredentials) ⇒ <code>Promise.&lt;ListCredentialsResponse&gt;</code>
    * [.deleteCredentials(ref)](#Credentials+deleteCredentials) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Credentials_new"></a>

### new Credentials(client)
Constructs a new Credentials object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const credentials = new SDK.Credentials(client);
    const response = await apiKeys.createCredentials(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My Credentials",
  username: "myusername",
  password: "mysecret"
};

main(request);
```
<a name="Credentials+createCredentials"></a>

### credentials.createCredentials(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new set of Credentials in the Workspace.

**Kind**: instance method of [<code>Credentials</code>](#Credentials)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Credentials  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateCredentialsRequest</code> | The request object that contains the necessary information to create a new set of Credentials |
| request.name | <code>string</code> | The name of the Credentials |
| request.username | <code>string</code> | The username of the Credentials |
| request.password | <code>string</code> | The password of the Credentials |

**Example**  
```js
const credentials = new SDK.Credentials(client); // Existing client object

const request = {
  name: "My Credentials",
  username: "myusername",
  password: "mysecret"
};

credentials
  .createCredentials(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Credentials+getCredentials"></a>

### credentials.getCredentials(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing set of Credentials in the Workspace.

**Kind**: instance method of [<code>Credentials</code>](#Credentials)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Credentials  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Credentials to retrieve |

**Example**  
```js
const credentials = new SDK.Credentials(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

credentials
  .getCredentials(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Credentials+updateCredentials"></a>

### credentials.updateCredentials(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing set of Credentials in the Workspace.

**Kind**: instance method of [<code>Credentials</code>](#Credentials)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Credentials  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateCredentialsRequest</code> | The request object that contains the necessary information to update an existing set of Credentials |
| request.ref | <code>string</code> | The reference of the Credentials to update |
| request.name | <code>string</code> | The name of the Credentials |
| request.password | <code>string</code> | The password of the Credentials |

**Example**  
```js
const credentials = new SDK.Credentials(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My Credentials",
  password: "mysecret"
};

credentials
   .updateCredentials(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Credentials+listCredentials"></a>

### credentials.listCredentials(request) ⇒ <code>Promise.&lt;ListCredentialsResponse&gt;</code>
Retrieves a list of Credentials from a Workspace.

**Kind**: instance method of [<code>Credentials</code>](#Credentials)  
**Returns**: <code>Promise.&lt;ListCredentialsResponse&gt;</code> - - The response object that contains the list of Credentials  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListCredentialsRequest</code> | The request object that contains the necessary information to retrieve a list of Credentials |
| request.pageSize | <code>number</code> | The number of Credentials to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Credentials |

**Example**  
```js
const credentials = new SDK.Credentials(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

credentials
  .listCredentials(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Credentials+deleteCredentials"></a>

### credentials.deleteCredentials(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing set of Credentials from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Credentials</code>](#Credentials)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Credentials  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Credentials to delete |

**Example**  
```js
const credentials = new SDK.Credentials(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

credentials
  .deleteCredentials(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Domains"></a>

## Domains
Fonoster Domains, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Domain for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Domains](#Domains)
    * [new Domains(client)](#new_Domains_new)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getDomain(ref)](#Domains+getDomain) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateDomain(request)](#Domains+updateDomain) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listDomains(request)](#Domains+listDomains) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Domains_new"></a>

### new Domains(client)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const domains = new SDK.Domains(client);
    const response = await domains.createDomain(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My Domain",
  domainUri: "sip.project.fonoster.io"
};

main(request);
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Domain in the Workspace.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Domain  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateDomainRequest</code> | The request object that contains the necessary information to create a new Domain |
| request.name | <code>string</code> | The name of the Domain |
| request.domainUri | <code>string</code> | The URI of the Domain |
| request.accessControlListRef | <code>AccessControlListRef</code> | The reference to the Access Control List (ACL) to associate with the Domain |
| request.egressPolicy | <code>Array.&lt;EgressPolicy&gt;</code> | The egress policy of the Domain |
| request.egressPolicy[].rule | <code>string</code> | A regular expression that defines which calls to send to the PSTN |
| request.egressPolicy[].numberRef | <code>string</code> | The Number that will be used to send the call to the PSTN |

**Example**  
```js
const domains = new SDK.Domains(client); // Existing client object

const request = {
  name: "My Domain",
  domainUri: "sip.project.fonoster.io"
};

domains
  .createDomain(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Domains+getDomain"></a>

### domains.getDomain(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Domain in the Workspace.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Domain  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Domain to retrieve |

**Example**  
```js
const domains = new SDK.Domains(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

domains
  .getDomain(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Domains+updateDomain"></a>

### domains.updateDomain(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Domain in the Workspace.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Domain  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateDomainRequest</code> | The request object that contains the necessary information to update an existing Domain |
| request.ref | <code>string</code> | The reference of the Domain to update |
| request.name | <code>string</code> | The name of the Domain |
| request.domainUri | <code>string</code> | The URI of the Domain |
| request.accessControlListRef | <code>AccessControlListRef</code> | The reference to the Access Control List (ACL) to associate with the Domain |
| request.egressPolicy | <code>Array.&lt;EgressPolicy&gt;</code> | The egress policy of the Domain |
| request.egressPolicy[].rule | <code>string</code> | A regular expression that defines which calls to send to the PSTN |
| request.egressPolicy[].numberRef | <code>string</code> | The Number that will be used to send the call to the PSTN |

**Example**  
```js
const domains = new SDK.Domains(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  accessControlListRef: "00000000-0000-0000-0000-000000000001"
};

domains
  .updateDomain(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Domains+listDomains"></a>

### domains.listDomains(request) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
Retrieves a list of Domains from a Workspace.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;ListDomainsResponse&gt;</code> - - The response object that contains the list of Domains  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListDomainsRequest</code> | The request object that contains the necessary information to retrieve a list of Domains |
| request.pageSize | <code>number</code> | The number of Domains to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Domains |

**Example**  
```js
const domains = new SDK.Domains(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

domains
  .listDomains(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Domain from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Domain  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Domain to delete |

**Example**  
```js
const domains = new SDK.Domains(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

domains
  .deleteDomain(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Numbers"></a>

## Numbers
Fonoster Numbers, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Number for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Numbers](#Numbers)
    * [new Numbers(client)](#new_Numbers_new)
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Numbers_new"></a>

### new Numbers(client)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const numbers = new SDK.Numbers(client);
    const response = await numbers.createNumber(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My Number",
  telUrl: "tel:+17853178070",
  city: "Asheville",
  country: "United States",
  countryIsoCode: "US"
};

main(request);
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Number in the Workspace.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Number  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | The request object that contains the necessary information to create a new Number |
| request.name | <code>string</code> | The name of the Number |
| request.telUrl | <code>string</code> | The telUrl of the Number |
| request.city | <code>string</code> | The city of the Number |
| request.country | <code>string</code> | The country of the Number |
| request.countryIsoCode | <code>string</code> | The countryIsoCode of the Number |

**Example**  
```js
const numbers = new SDK.Numbers(client); // Existing client object

const request = {
  name: "My Number",
  telUrl: "tel:+17853178070",
  city: "Asheville",
  country: "United States",
  countryIsoCode: "US"
};

numbers
  .createNumber(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Number in the Workspace.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Number  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Number to retrieve |

**Example**  
```js
const numbers = new SDK.Numbers(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

numbers
  .getNumber(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Number in the Workspace.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Number  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | The request object that contains the necessary information to update an existing Number |
| request.ref | <code>string</code> | The reference of the Number to update |
| request.name | <code>string</code> | The name of the Number |

**Example**  
```js
const numbers = new SDK.Numbers(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My Number"
};

numbers
  .updateNumber(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
Retrieves a list of Numbers from a Workspace.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - - The response object that contains the list of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> | The request object that contains the necessary information to retrieve a list of Numbers |
| request.pageSize | <code>number</code> | The number of Numbers to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Numbers |

**Example**  
```js
const numbers = new SDK.Numbers(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

numbers
  .listNumbers(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Numbers+deleteNumber"></a>

### numbers.deleteNumber(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Number from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Number  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Number to delete |

**Example**  
```js
const numbers = new SDK.Numbers(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

numbers
  .deleteNumber(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Secrets"></a>

## Secrets
Fonoster Secrets, part of the Fonoster Core,
allows you to create, update, retrieve, and delete Secrets for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Secrets](#Secrets)
    * [new Secrets(client)](#new_Secrets_new)
    * [.createSecret(request)](#Secrets+createSecret) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getSecret(ref)](#Secrets+getSecret) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateSecret(request)](#Secrets+updateSecret) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listSecrets(request)](#Secrets+listSecrets) ⇒ <code>Promise.&lt;ListSecretsResponse&gt;</code>
    * [.deleteSecret(ref)](#Secrets+deleteSecret) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Secrets_new"></a>

### new Secrets(client)
Constructs a new Secrets object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const secrets = new SDK.Secrets(client);
    const response = await secrets.creteSecret(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "FRIENDLY_NAME",
  secret: "mysecret"
};

main(request);
```
<a name="Secrets+createSecret"></a>

### secrets.createSecret(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Secret in the Workspace.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Secret  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | The request object that contains the necessary information to create a new Secret |
| request.name | <code>string</code> | The name of the Secret |
| request.secret | <code>string</code> | The secret of the Secret |

**Example**  
```js
const secrets = new SDK.Secrets(client); // Existing client object

const request = {
  name: "FRIENDLY_NAME",
  secret: "mysecret"
};

secrets
  .createSecret(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Secrets+getSecret"></a>

### secrets.getSecret(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Secret in the Workspace.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Secret  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Secret to retrieve |

**Example**  
```js
const secrets = new SDK.Secrets(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

secrets
  .getSecret(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Secrets+updateSecret"></a>

### secrets.updateSecret(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Secret in the Workspace.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Secret  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateSecretRequest</code> | The request object that contains the necessary information to update an existing Secret |
| request.ref | <code>string</code> | The reference of the Secret to update |
| request.name | <code>string</code> | The name of the Secret |
| request.secret | <code>string</code> | The secret of the Secret |

**Example**  
```js
const secrets = new SDK.Secrets(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  secret: "mysecret"
};

secrets
  .updateSecret(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Secrets+listSecrets"></a>

### secrets.listSecrets(request) ⇒ <code>Promise.&lt;ListSecretsResponse&gt;</code>
Retrieves a list of Secrets from a Workspace.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;ListSecretsResponse&gt;</code> - - The response object that contains the list of Secrets  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListSecretsRequest</code> | The request object that contains the necessary information to retrieve a list of Secrets |
| request.pageSize | <code>number</code> | The secret of Secrets to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Secrets |

**Example**  
```js
const secrets = new SDK.Secrets(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

secrets
  .listSecrets(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Secrets+deleteSecret"></a>

### secrets.deleteSecret(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Secret from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Secret  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Secret to delete |

**Example**  
```js
const secrets = new SDK.Secrets(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

secrets
  .deleteSecret(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Trunks"></a>

## Trunks
Fonoster Trunks, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Trunks for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Trunks](#Trunks)
    * [new Trunks(client)](#new_Trunks_new)
    * [.createTrunk(request)](#Trunks+createTrunk) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getTrunk(ref)](#Trunks+getTrunk) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateTrunk(request)](#Trunks+updateTrunk) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listTrunks(request)](#Trunks+listTrunks) ⇒ <code>Promise.&lt;ListTrunksResponse&gt;</code>
    * [.deleteTrunk(ref)](#Trunks+deleteTrunk) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Trunks_new"></a>

### new Trunks(client)
Constructs a new Trunks object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const trunks = new SDK.Trunks(client);
    const response = await trunks.createTrunk(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My Trunk",
  inboundUri: "sip.company.fonoster.io"
};

main(request);
```
<a name="Trunks+createTrunk"></a>

### trunks.createTrunk(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Trunk in the Workspace.

**Kind**: instance method of [<code>Trunks</code>](#Trunks)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Trunk  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTrunkRequest</code> | The request object that contains the necessary information to create a new Trunk |
| request.name | <code>string</code> | The name of the Trunk |
| request.inboundUri | <code>string</code> | The inboundUri of the Trunk |
| request.sendRegister | <code>boolean</code> | The sendRegister of the Trunk |
| request.accessControlListRef | <code>string</code> | The accessControlListRef of the Trunk |
| request.inboundCredentialsRef | <code>string</code> | The inboundCredentialsRef of the Trunk |
| request.outboundCredentialsRef | <code>string</code> | The outboundCredentialsRef of the Trunk |
| request.uris | <code>Array.&lt;TrunkUri&gt;</code> | The uris of the Trunk |
| request.uris[].host | <code>string</code> | The host of the Trunk |
| request.uris[].port | <code>number</code> | The port of the Trunk |
| request.uris[].transport | <code>Transport</code> | The transport of the Trunk |
| request.uris[].user | <code>string</code> | Optional user of the Trunk |
| request.uris[].weight | <code>number</code> | Optional weight of the Trunk |
| request.uris[].priority | <code>number</code> | Optional priority of the Trunk |
| request.uris[].enabled | <code>boolean</code> | Optional enabled of the Trunk |

**Example**  
```js
const trunks = new SDK.Trunks(client); // Existing client object

const request = {
  name: "My Trunk",
  inboundUri: "sip.company.fonoster.io"
  sendRegister: true
  uris: [{
    host: "sip.company.fonoster.io",
    port: 5060,
    transport: "UDP",
    user: "user",
    weight: 0,
    priority: 0,
    enabled: true
  }]
};

trunks
  .createTrunk(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Trunks+getTrunk"></a>

### trunks.getTrunk(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Trunk in the Workspace.

**Kind**: instance method of [<code>Trunks</code>](#Trunks)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Trunk  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Trunk to retrieve |

**Example**  
```js
const trunks = new SDK.Trunks(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

trunks
  .getTrunk(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Trunks+updateTrunk"></a>

### trunks.updateTrunk(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Trunk in the Workspace.

**Kind**: instance method of [<code>Trunks</code>](#Trunks)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Trunk  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateTrunkRequest</code> | The request object that contains the necessary information to update an existing Trunk |
| request.ref | <code>string</code> | The reference of the Trunk to update |
| request.name | <code>string</code> | The name of the Trunk |
| request.sendRegister | <code>boolean</code> | The sendRegister of the Trunk |
| request.accessControlListRef | <code>string</code> | The accessControlListRef of the Trunk |
| request.inboundCredentialsRef | <code>string</code> | The inboundCredentialsRef of the Trunk |
| request.outboundCredentialsRef | <code>string</code> | The outboundCredentialsRef of the Trunk |
| request.uris | <code>Array.&lt;TrunkUri&gt;</code> | The uris of the Trunk |
| request.uris[].host | <code>string</code> | The host of the Trunk |
| request.uris[].port | <code>number</code> | The port of the Trunk |
| request.uris[].transport | <code>Transport</code> | The transport of the Trunk |
| request.uris[].user | <code>string</code> | Optional user of the Trunk |
| request.uris[].weight | <code>number</code> | Optional weight of the Trunk |
| request.uris[].priority | <code>number</code> | Optional priority of the Trunk |
| request.uris[].enabled | <code>boolean</code> | Optional enabled of the Trunk |

**Example**  
```js
const trunks = new SDK.Trunks(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My Trunk",
  sendRegister: true
  uris: [{
    host: "sip.company.fonoster.io",
    port: 5060,
    transport: "UDP",
    user: "user",
    weight: 0,
    priority: 0,
    enabled: true
  }]
};

trunks
  .updateTrunk(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Trunks+listTrunks"></a>

### trunks.listTrunks(request) ⇒ <code>Promise.&lt;ListTrunksResponse&gt;</code>
Retrieves a list of Trunks from a Workspace.

**Kind**: instance method of [<code>Trunks</code>](#Trunks)  
**Returns**: <code>Promise.&lt;ListTrunksResponse&gt;</code> - - The response object that contains the list of Trunks  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListTrunksRequest</code> | The request object that contains the necessary information to retrieve a list of Trunks |
| request.pageSize | <code>number</code> | The trunk of Trunks to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of Trunks |

**Example**  
```js
const trunks = new SDK.Trunks(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

trunks
  .listTrunks(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Trunks+deleteTrunk"></a>

### trunks.deleteTrunk(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Trunk from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Trunks</code>](#Trunks)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Trunk  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Trunk to delete |

**Example**  
```js
const trunks = new SDK.Trunks(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

trunks
   .deleteTrunk(ref)
   .then(console.log) // successful response
   .catch(console.error); // an error occurred
```

<a name="Users"></a>

## Users
Fonoster Users, part of the Fonoster Identity subsystem,
allows you to create, update, retrieve, and delete a Users in the system.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Users](#Users)
    * [new Users(client)](#new_Users_new)
    * [.createUser(request)](#Users+createUser) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.createUserWithOauth2Code(request)](#Users+createUserWithOauth2Code) ⇒ <code>Promise.&lt;ExchangeCredentialsResponse&gt;</code>
    * [.getUser(ref)](#Users+getUser) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateUser(request)](#Users+updateUser) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.sendResetPasswordCode(request)](#Users+sendResetPasswordCode) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.resetPassword(request)](#Users+resetPassword) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.deleteUser(ref)](#Users+deleteUser) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Users_new"></a>

### new Users(client)
Constructs a new Users object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

const client = SDK.Client();
const users = new SDK.Users(client);

const request = {
  name: "John Doe",
  email: "john.doe@example.com",
  password: "password",
  avatar: "https://example.com/avatar.jpg"
};

users.createUser(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+createUser"></a>

### users.createUser(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new User in the Workspace.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created User  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateUserRequest</code> | The request object that contains the necessary information to create a new User |
| request.name | <code>string</code> | The name of the User |
| request.email | <code>string</code> | The email of the User |
| request.password | <code>string</code> | The password of the User |
| request.avatar | <code>string</code> | The avatar of the User |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const request = {
  name: "John Doe",
  email: "john.doe@example.com",
  password: "password",
  avatar: "https://example.com/avatar.jpg"
};

users
  .createUser(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+createUserWithOauth2Code"></a>

### users.createUserWithOauth2Code(request) ⇒ <code>Promise.&lt;ExchangeCredentialsResponse&gt;</code>
Create a new User using an OAuth2 code and return the id, access, and refresh tokens for the User.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;ExchangeCredentialsResponse&gt;</code> - - The response object that contains the id, access, and refresh tokens  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateUserWithOauth2CodeRequest</code> | The request object with the OAuth2 code |
| request.code | <code>string</code> | The OAuth2 code of the User |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const request = {
  code: "fd4d78beb31aa25b93de"
};

users.createUserWithOauth2Code(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+getUser"></a>

### users.getUser(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing User in the Workspace.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the User  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the User to retrieve |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

users
  .getUser(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+updateUser"></a>

### users.updateUser(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing User in the Workspace.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated User  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateUserRequest</code> | The request object that contains the necessary information to update a User |
| request.ref | <code>string</code> | The reference of the User to update |
| request.name | <code>string</code> | The name of the User |
| request.password | <code>string</code> | The password of the User |
| request.avatar | <code>string</code> | The avatar of the User |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "John Doe",
  password: "password",
  avatar: "https://example.com/avatar.jpg"
};

users
  .updateUser(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+sendResetPasswordCode"></a>

### users.sendResetPasswordCode(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Sends a reset password code to the User.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the User  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>SendResetPasswordCodeRequest</code> | The request object that contains the necessary information to send a reset password code to a User |
| request.username | <code>string</code> | The username of the User |
| request.resetPasswordUrl | <code>string</code> | The URL to reset the password |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const request = {
  username: "john.doe@example.com",
  resetPasswordUrl: "https://example.com/reset-password"
};

users
  .sendResetPasswordCode(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+resetPassword"></a>

### users.resetPassword(request) ⇒ <code>Promise.&lt;void&gt;</code>
Resets the password of the User.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;void&gt;</code> - - The response object that contains the reference to the User  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ResetPasswordRequest</code> | The request object that contains the necessary information to reset the password of a User |
| request.username | <code>string</code> | The username of the User |
| request.password | <code>string</code> | The new password of the User |
| request.verificationCode | <code>string</code> | The verification code of the User |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const request = {
  username: "john.doe@example.com",
  password: "password",
  verificationCode: "123456"
};

users
  .resetPassword(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Users+deleteUser"></a>

### users.deleteUser(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing User from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted User  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the User to delete |

**Example**  
```js
const users = new SDK.Users(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

users
  .deleteUser(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

<a name="Workspaces"></a>

## Workspaces
Fonoster Workspaces, part of the Fonoster Identity subsystem,
allows you to create, update, retrieve, and delete Workspaces in the system.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Workspaces](#Workspaces)
    * [new Workspaces(client)](#new_Workspaces_new)
    * [.createWorkspace(request)](#Workspaces+createWorkspace) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.getWorkspace(ref)](#Workspaces+getWorkspace) ⇒ <code>Promise.&lt;Acl&gt;</code>
    * [.updateWorkspace(request)](#Workspaces+updateWorkspace) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.deleteWorkspace(ref)](#Workspaces+deleteWorkspace) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listWorkspaces()](#Workspaces+listWorkspaces) ⇒ <code>Promise.&lt;ListWorkspacesResponse&gt;</code>
    * [.inviteUserToWorkspace(request)](#Workspaces+inviteUserToWorkspace) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.resendWorkspaceMembershipInvitation(userRef)](#Workspaces+resendWorkspaceMembershipInvitation) ⇒ <code>Promise.&lt;ResendWorkspaceMembershipInvitationResponse&gt;</code>
    * [.listWorkspaceMembers(request)](#Workspaces+listWorkspaceMembers) ⇒ <code>Promise.&lt;ListWorkspaceMembersResponse&gt;</code>
    * [.removeUserFromWorkspace(userRef)](#Workspaces+removeUserFromWorkspace) ⇒ <code>Promise.&lt;RemoveUserFromWorkspaceResponse&gt;</code>

<a name="new_Workspaces_new"></a>

### new Workspaces(client)
Constructs a new Workspaces object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

async function main(request) {
  const apiKey = "your-api-key";
  const apiSecret = "your-api-secret"
  const accessKeyId = "WO00000000000000000000000000000000";

  try {
    const client = SDK.Client({ accessKeyId });
    await client.loginWithApiKey(apiKey, apiSecret);

    const workspaces = new SDK.Workspaces(client);
    const response = await workspaces.createWorkspace(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My Workspace"
};

main(request);
```
<a name="Workspaces+createWorkspace"></a>

### workspaces.createWorkspace(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Creates a new Workspace in the system.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the created Workspace  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateWorkspaceRequest</code> | The request object that contains the necessary information to create a new Workspace |
| request.name | <code>string</code> | The name of the Workspace |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const request = {
  name: "My Workspace"
};

workspaces
  .createWorkspace(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+getWorkspace"></a>

### workspaces.getWorkspace(ref) ⇒ <code>Promise.&lt;Acl&gt;</code>
Retrieves an existing Workspace in the system.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;Acl&gt;</code> - - The response object that contains the Workspace  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Workspace to retrieve |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

workspaces
  .getWorkspace(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+updateWorkspace"></a>

### workspaces.updateWorkspace(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Updates an existing Workspace in the system.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the updated Workspace  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateWorkspaceRequest</code> | The request object that contains the necessary information to update a Workspace |
| request.ref | <code>string</code> | The reference of the Workspace to update |
| request.name | <code>string</code> | The name of the Workspace |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const request = {
  ref: "00000000-0000-0000-0000-000000000000",
  name: "My Workspace"
};

workspaces
  .updateWorkspace(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+deleteWorkspace"></a>

### workspaces.deleteWorkspace(ref) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing Workspace from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted Workspace  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the Workspace to delete |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const ref = "00000000-0000-0000-0000-000000000000";

workspaces
  .deleteWorkspace(ref)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+listWorkspaces"></a>

### workspaces.listWorkspaces() ⇒ <code>Promise.&lt;ListWorkspacesResponse&gt;</code>
Retrieves a list of all Workspaces for the logged in user.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;ListWorkspacesResponse&gt;</code> - - The response object that contains the list of Workspaces  
**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

workspaces
  .listWorkspaces()
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+inviteUserToWorkspace"></a>

### workspaces.inviteUserToWorkspace(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Invites a User to a Workspace.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the invitation  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>InviteUserToWorkspaceRequest</code> | The request object that contains the necessary information to invite a User to a Workspace |
| request.workspaceRef | <code>string</code> | The reference of the Workspace to invite the User to |
| request.email | <code>string</code> | The email of the User to invite |
| request.password | <code>string</code> | Temporary password for the User. Leave empty to generate a random password |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const request = {
  workspaceRef: "00000000-0000-0000-0000-000000000000",
  email: "jane.doe@example.com",
  role: "WORKSPACE_MEMBER",
  password: "password" // Temporary password for the User. Leave empty to generate a random password
};

workspaces
  .inviteUserToWorkspace(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+resendWorkspaceMembershipInvitation"></a>

### workspaces.resendWorkspaceMembershipInvitation(userRef) ⇒ <code>Promise.&lt;ResendWorkspaceMembershipInvitationResponse&gt;</code>
Resend a Workspace membership invitation.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;ResendWorkspaceMembershipInvitationResponse&gt;</code> - - The response object that contains the reference to the invitation  

| Param | Type | Description |
| --- | --- | --- |
| userRef | <code>string</code> | The reference to the user to resend the invitation |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const userRef: "00000000-0000-0000-0000-000000000000";

workspaces
  .resendWorkspaceMembershipInvitation(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+listWorkspaceMembers"></a>

### workspaces.listWorkspaceMembers(request) ⇒ <code>Promise.&lt;ListWorkspaceMembersResponse&gt;</code>
List the members of a Workspace

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;ListWorkspaceMembersResponse&gt;</code> - - The response object that contains the list of members  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListWorkspaceMembersRequest</code> | Request object to list the members of a Workspace |
| request.pageSize | <code>number</code> | The number of members to return in the response |
| request.pageToken | <code>string</code> | The page token to return the next page of members |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const request = {
  pageSize: 10,
  pageToken: "00000000-0000-0000-0000-000000000000"
};

workspaces
  .listWorkspaceMembers(request)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```
<a name="Workspaces+removeUserFromWorkspace"></a>

### workspaces.removeUserFromWorkspace(userRef) ⇒ <code>Promise.&lt;RemoveUserFromWorkspaceResponse&gt;</code>
Removes a User from a Workspace.

**Kind**: instance method of [<code>Workspaces</code>](#Workspaces)  
**Returns**: <code>Promise.&lt;RemoveUserFromWorkspaceResponse&gt;</code> - - The response object that contains the reference to the removed User  

| Param | Type | Description |
| --- | --- | --- |
| userRef | <code>string</code> | The reference of the User to remove from the Workspace |

**Example**  
```js
const workspaces = new SDK.Workspaces(client); // Existing client object

const userRef = "00000000-0000-0000-0000-000000000000";

workspaces
  .removeUserFromWorkspace(userRef)
  .then(console.log) // successful response
  .catch(console.error); // an error occurred
```

