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
const accessKeyId = "WO00000000000000000000000000000000";
const client = new SDK.Client({ accessKeyId });
```

By default, the Client object will point to Fonoster's cloud services. If you are running your own instance of Fonoster, you can specify the `endpoint` parameter to point to it.

In the browser:

```typescript
const SDK = require("@fonoster/sdk");
const accessKeyId = "WO00000000000000000000000000000000";
const client = new SDK.WebClient({ accessKeyId });
```

By default, the WebClient object points to Fonoster's cloud services. If you are running your own instance of Fonoster, you can specify the `url` parameter to point to it.

### Login in and making requests

```typescript
const username = "admin@fonoster.local";
const password = "changeme";

async function main() {
  await client.login(username, password);
  const applications = new SDK.Applications(client);
  await applications.createApplication({
    name: "MyApp",
    type: "PROGRAMMABLE_VOICE",
    appEndpoint: "localhost:3000" // Your app's endpoint
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
 const username = "admin";
 const password = "1234";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

    const acls = new SDK.Acls(client);
    const response = await acls.createAcl(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My ACL",
  allow: ["47.132.130.31"], // Allow only this IP
  deny: ["0.0.0.0/0"] // Deny all other IPs
};

main(request).catch(console.error);
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
const ref =  "00000000-0000-0000-0000-000000000000"

const acls = new SDK.Acls(client); // Existing client object

acls.deleteAcl(ref)
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
 const username = "admin";
 const password = "1234";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

    const agents = new SDK.Agents(client);
    const response = await agents.createAgent(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "John Doe",
  username: `1001`,
  privacy: "PRIVATE",
  enabled: true,
  maxContacts: 3
  domainRef: "00000000-0000-0000-0000-000000000000"
};

main(request).catch(console.error);
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
const ref =  "00000000-0000-0000-0000-000000000000"

const agents = new SDK.Agents(client); // Existing client object

agents.deleteAgent(ref)
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
 const username = "yourusername";
 const apiKey = "yourpassword";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

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

main(request).catch(console.error);
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
const ref =  "00000000-0000-0000-0000-000000000000"

const apiKeys = new SDK.ApiKeys(client); // Existing client object

apiKeys.deleteApiKey(ref)
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
 const username = "admin";
 const password = "yourpassword";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

    const apps = new SDK.Applications(client);
    const response = await apps.createApplication(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  name: "My application",
  type: "PROGRAMMABLE_VOICE",
  appEndpoint: "myapp.mydomain.com",
  textToSpeech: {
    productRef: "tts.google",
    config: {
      voice: "en-US-Casual-K"
    }
  },
  speechToText: {
    productRef: "stt.google",
    config: {
     languageCode: "en-US"
    }
  },
  intelligence: {
    productRef: "nlu.dialogflowcx",
    credentials: {
       apiKey: "your-api-key"
    },
    config: {
      agentId: "your-agent-id"
    }
  }
};

main(request).catch(console.error);
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
| request.type | <code>ApplicationType</code> | The type of application (e.g., PROGRAMMABLE_VOICE) |
| request.appEndpoint | <code>string</code> | The endpoint where the application is hosted |
| request.textToSpeech | <code>TextToSpeech</code> | The text-to-speech configuration |
| request.textToSpeech.productRef | <code>string</code> | The product reference of the text-to-speech engine (e.g., tts.google) |
| request.textToSpeech.config | <code>object</code> | The configuration object for the text-to-speech engine (e.g., { voice: "en-US-Casual-K" }) |
| request.speechToText | <code>SpeechToText</code> | The speech-to-text configuration |
| request.speechToText.productRef | <code>string</code> | The product reference of the speech-to-text engine (e.g., stt.google) |
| request.speechToText.config | <code>object</code> | The configuration object for the speech-to-text engine (e.g., { languageCode: "en-US" }) |
| request.intelligence | <code>Intelligence</code> | The intelligence configuration |
| request.intelligence.productRef | <code>string</code> | The product reference of the intelligence engine (e.g., nlu.dialogflowcx) |
| request.intelligence.credentials | <code>object</code> | The credentials object for the intelligence engine (e.g., { apiKey: "your-api-key" }) |
| request.intelligence.config | <code>object</code> | The configuration object for the intelligence engine (e.g., { agentId: "your-agent-id" }) |

**Example**  
```js
const request = {
  name: "My application",
  type: "PROGRAMMABLE_VOICE",
  appEndpoint: "myapp.mydomain.com",
  textToSpeech: {
    productRef: "tts.google",
    config: {
      voice: "en-US-Casual-K"
    }
  },
  speechToText: {
    productRef: "stt.google",
    config: {
     languageCode: "en-US"
    }
  },
  intelligence: {
    productRef: "nlu.dialogflowcx",
    credentials: {
       apiKey: "your-api-key"
    },
    config: {
      agentId: "your-agent-id"
    }
  }
};

const apps = new SDK.Applications(client); // Existing client object

apps.createApplication(request)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```
<a name="Applications+getApplication"></a>

### applications.getApplication(ref) ⇒ <code>Promise.&lt;Application&gt;</code>
Retrieves an existing application from Fonoster.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;Application&gt;</code> - - The response object that contains the application information  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference of the application to retrieve |

**Example**  
```js
const request = {
 ref: "00000000-0000-0000-0000-000000000000"
};

const apps = new SDK.Applications(client); // Existing client object

apps.getApplication(request)
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
| request.appEndpoint | <code>string</code> | The endpoint where the application is hosted |
| request.textToSpeech | <code>TextToSpeech</code> | The text-to-speech configuration |
| request.textToSpeech.productRef | <code>string</code> | The product reference of the text-to-speech engine (e.g., tts.google) |
| request.textToSpeech.config | <code>object</code> | The configuration object for the text-to-speech engine (e.g., { voice: "en-US-Casual-K" }) |
| request.speechToText | <code>SpeechToText</code> | The speech-to-text configuration |
| request.speechToText.productRef | <code>string</code> | The product reference of the speech-to-text engine (e.g., stt.google) |
| request.speechToText.config | <code>object</code> | The configuration object for the speech-to-text engine (e.g., { languageCode: "en-US" }) |
| request.intelligence | <code>Intelligence</code> | The intelligence configuration |
| request.intelligence.productRef | <code>string</code> | The product reference of the intelligence engine (e.g., nlu.dialogflowcx) |
| request.intelligence.credentials | <code>object</code> | The credentials object for the intelligence engine (e.g., { apiKey: "your-api-key" }) |
| request.intelligence.config | <code>object</code> | The configuration object for the intelligence engine (e.g., { agentId: "your-agent-id" }) |

**Example**  
```js
const request = {
 ref: "00000000-0000-0000-0000-000000000000",
 name: "My application",
 appEndpoint: "myapp.mydomain.com"
}

const apps = new SDK.Applications(client); // Existing client object

apps.updateApplication(request)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```
<a name="Applications+listApplications"></a>

### applications.listApplications(request) ⇒ <code>Promise.&lt;ListApplicationsResponse&gt;</code>
Retrieves a list of applications from Fonoster.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;ListApplicationsResponse&gt;</code> - - The response object that contains the list of applications  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListApplicationsRequest</code> | The request object that contains the necessary information to retrieve a list of applications |
| request.pageSize | <code>number</code> | The number of applications to retrieve |
| request.pageToken | <code>string</code> | The token to retrieve the next page of applications |

**Example**  
```js
const request = {
 pageSize: 10,
 pageToken: "00000000-0000-0000-0000-000000000000"
};

const apps = new SDK.Applications(client); // Existing client object

apps.listApplications(request)
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
const ref =  "00000000-0000-0000-0000-000000000000"

const apps = new SDK.Applications(client); // Existing client object

apps.deleteApplication(ref)
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
 const username = "admin";
 const password = "yourpassword";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

    const calls = new SDK.Calls(client);
    const response = await apiKeys.createCall(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  from: "8287854037",
  to: "+17853178070",
  appRef: "00000000-0000-0000-0000-000000000000"
};

main(request).catch(console.error);
```

<a name="Credentials"></a>

## Credentials
Fonoster Calls, part of the Fonoster SIP Proxy subsystem,
allows you to create, update, retrieve, and delete SIP Credentials for your deployment.
Note that an active Fonoster deployment is required.

**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Credentials](#Credentials)
    * [new Credentials(client)](#new_Credentials_new)
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
 const username = "admin";
 const password = "yourpassword";
 const accessKeyId = "00000000-0000-0000-0000-000000000000";

 try {
    const client = SDK.Client({ accessKeyId });
    await client.login({ username, password });

    const credentials = new SDK.Credentials(client);
    const response = await apiKeys.createCredentials(request);

    console.log(response); // successful response
  } catch (e) {
    console.error(e); // an error occurred
  }
}

const request = {
  from: "8287854037",
  to: "+17853178070",
  appRef: "00000000-0000-0000-0000-000000000000"
};

main(request).catch(console.error);
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
const ref =  "00000000-0000-0000-0000-000000000000"

const credentials = new SDK.Credentials(client); // Existing client object

credentials.deleteCredentials(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Domains"></a>

## Domains
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Domains](#Domains)
    * [new Domains(client)](#new_Domains_new)
    * [.deleteDomain(ref)](#Domains+deleteDomain) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Domains_new"></a>

### new Domains(client)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const domains = new SDK.Domains(client); // Existing client object

domains.deleteDomain(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Numbers"></a>

## Numbers
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Numbers](#Numbers)
    * [new Numbers(client)](#new_Numbers_new)
    * [.deleteNumber(ref)](#Numbers+deleteNumber) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Numbers_new"></a>

### new Numbers(client)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const numbers = new SDK.Numbers(client); // Existing client object

numbers.deleteDomain(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Secrets"></a>

## Secrets
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Secrets](#Secrets)
    * [new Secrets(client)](#new_Secrets_new)
    * [.deleteSecret(ref)](#Secrets+deleteSecret) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Secrets_new"></a>

### new Secrets(client)
Constructs a new Secrets object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const secrets = new SDK.Secrets(client); // Existing client object

secrets.deleteSecret(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Trunks"></a>

## Trunks
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Trunks](#Trunks)
    * [new Trunks(client)](#new_Trunks_new)
    * [.deleteTrunk(ref)](#Trunks+deleteTrunk) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Trunks_new"></a>

### new Trunks(client)
Constructs a new Trunks object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const trunks = new SDK.Trunks(client); // Existing client object

trunks.deleteTrunk(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Users"></a>

## Users
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Users](#Users)
    * [new Users(client)](#new_Users_new)
    * [.deleteUser(ref)](#Users+deleteUser) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Users_new"></a>

### new Users(client)
Constructs a new Users object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const users = new SDK.Users(client); // Existing client object

users.deleteUser(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

<a name="Workspaces"></a>

## Workspaces
**Kind**: global class  
**See**

- AbstractClient
- FonosterClient


* [Workspaces](#Workspaces)
    * [new Workspaces(client)](#new_Workspaces_new)
    * [.deleteWorkspace(ref)](#Workspaces+deleteWorkspace) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Workspaces_new"></a>

### new Workspaces(client)
Constructs a new Workspaces object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

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
const ref =  "00000000-0000-0000-0000-000000000000"

const workspaces = new SDK.Workspaces(client); // Existing client object

workspaces.deleteWorkspace(ref)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

