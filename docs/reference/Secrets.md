<a name="Secrets"></a>

## Secrets ⇐ <code>FonosService</code>
Use Fonos Secrets, a capability of Fonos Secrets Service,
to create and manage your secrets. Fonos Secrets requires of a
running Fonos deployment.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [Secrets](#Secrets) ⇐ <code>FonosService</code>
    * [new Secrets(options)](#new_Secrets_new)
    * [new Secrets(options)](#new_Secrets_new)
    * [.createSecret(request)](#Secrets+createSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.getSecret(request)](#Secrets+getSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.listSecret(request)](#Secrets+listSecret) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
    * [.deleteSecret(request)](#Secrets+deleteSecret) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.createSecret(request)](#Secrets+createSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.getSecret(request)](#Secrets+getSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.listSecret(request)](#Secrets+listSecret) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
    * [.deleteSecret(request)](#Secrets+deleteSecret) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_Secrets_new"></a>

### new Secrets(options)
Constructs a Secret Object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ServiceOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonos = require("@fonos/sdk")
const secrets = new Fonos.Secrets()

const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="new_Secrets_new"></a>

### new Secrets(options)
Constructs a Secret Object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ServiceOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonos = require("@fonos/sdk")
const secrets = new Fonos.Secrets()

const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+createSecret"></a>

### secrets.createSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Creates a new Secret.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+getSecret"></a>

### secrets.getSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Get a Secret.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+listSecret"></a>

### secrets.listSecret(request) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
List all user secrets.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   pageSize: 1,
   pageToken: 1
};

secrets.listSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+deleteSecret"></a>

### secrets.deleteSecret(request) ⇒ <code>Promise.&lt;void&gt;</code>
Retrives a Secret using its reference.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;void&gt;</code> - The domain  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>string</code> | Reference to Secret |

**Example**  
```js
secrets.deleteSecret("jenkins")
.then(() => {
  console.log("successful")      // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+createSecret"></a>

### secrets.createSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Creates a new Secret.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+getSecret"></a>

### secrets.getSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Get a Secret.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   secretName: "Jenkins",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+listSecret"></a>

### secrets.listSecret(request) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
List all user secrets.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListSecretRequest</code> | Request for the provision of a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | secret to be save |

**Example**  
```js
const request = {
   pageSize: 1,
   pageToken: 1
};

secrets.listSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+deleteSecret"></a>

### secrets.deleteSecret(request) ⇒ <code>Promise.&lt;void&gt;</code>
Retrives a Secret using its reference.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  
**Returns**: <code>Promise.&lt;void&gt;</code> - The domain  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>string</code> | Reference to Secret |

**Example**  
```js
secrets.deleteSecret("jenkins")
.then(() => {
  console.log("successful")      // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
