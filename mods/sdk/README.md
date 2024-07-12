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

In the browser:

```typescript
const SDK = require("@fonoster/sdk");
const accessKeyId = "WO00000000000000000000000000000000";
const client = new SDK.WebClient({ accessKeyId });
```

### Logging in and making requests

```typescript
const username = "admin@fonoster.local";
const password = "changeme";

client.login(username, password)
 .then(async () => {
    const applications = new SDK.Applications(client);
    await applications.createApplication({
      name: "MyApp",
      type: "PROGRAMMABLE_VOICE",
      appEndpoint: "localhost:3000" // Your app endpoint
 });
 })
 .catch(console.error);
```

## APIs

* [`Applications`](#Applications)



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
    * [.getApplication(request)](#Applications+getApplication) ⇒ <code>Promise.&lt;Application&gt;</code>
    * [.updateApplication(request)](#Applications+updateApplication) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
    * [.listApplications(request)](#Applications+listApplications) ⇒ <code>Promise.&lt;ListApplicationsResponse&gt;</code>
    * [.deleteApplication(request)](#Applications+deleteApplication) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>

<a name="new_Applications_new"></a>

### new Applications(client)
Constructs a new Applications object.


| Param | Type | Description |
| --- | --- | --- |
| client | <code>FonosterClient</code> | Client object with underlying implementations to make requests to Fonoster's API |

**Example**  
```js
const SDK = require("@fonoster/sdk");

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

const username = "admin@fonoster.local";
const password = "changeme";
const accessKeyId = "WO00000000000000000000000000000000";

const client = new SDK.Client({ accessKeyId });

client.login(username, password)
 .then(async () => {
   const apps = new SDK.Applications(client);
   const result = await apps.createApplication(request);
   console.log(result);  // successful response
 }).catch(console.error); // an error occurred
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

### applications.getApplication(request) ⇒ <code>Promise.&lt;Application&gt;</code>
Retrieves an existing application from Fonoster.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;Application&gt;</code> - - The response object that contains the application information  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetApplicationRequest</code> | The request object that contains the necessary information to retrieve an application |
| request.ref | <code>string</code> | The reference of the application to retrieve |

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

### applications.deleteApplication(request) ⇒ <code>Promise.&lt;BaseApiObject&gt;</code>
Deletes an existing application from Fonoster.
Note that this operation is irreversible.

**Kind**: instance method of [<code>Applications</code>](#Applications)  
**Returns**: <code>Promise.&lt;BaseApiObject&gt;</code> - - The response object that contains the reference to the deleted application  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeleteApplicationRequest</code> | The request object that contains the necessary information to delete an application |
| request.ref | <code>string</code> | The reference of the application to delete |

**Example**  
```js
const request = {
 ref: "00000000-0000-0000-0000-000000000000"
};

const apps = new SDK.Applications(client); // Existing client object

apps.deleteApplication(request)
 .then(console.log) // successful response
 .catch(console.error); // an error occurred
```

