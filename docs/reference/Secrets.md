<a name="Secrets"></a>

## Secrets ⇐ <code>APIClient</code>
Use Fonoster Secrets, a capability of Fonoster Secrets Service,
to create and manage your secrets. Fonoster Secrets requires of a
running Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Secrets](#Secrets) ⇐ <code>APIClient</code>
    * [new Secrets(options)](#new_Secrets_new)
    * [.createSecret(request)](#Secrets+createSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.getSecret(request)](#Secrets+getSecret) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
    * [.listSecrets(request)](#Secrets+listSecrets) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
    * [.deleteSecret(name)](#Secrets+deleteSecret)

<a name="new_Secrets_new"></a>

### new Secrets(options)
Constructs a Secrets Object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const secrets = new Fonoster.Secrets()

const request = {
   secretName: "my-secret",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // message with the CreateSecretResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+createSecret"></a>

### secrets.createSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Creates and stores a new secret.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request to create a new secret |
| request.name | <code>string</code> | Friendly name for the secret |
| request.secret | <code>string</code> | Actual secret |

**Example**  
```js
const request = {
   name: "my-secret",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+getSecret"></a>

### secrets.getSecret(request) ⇒ <code>Promise.&lt;CreateSecretResponse&gt;</code>
Gets a secret by name.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateSecretRequest</code> | Request to create a new Secret |
| request.name | <code>string</code> | Friendly name for the Secret |
| request.secret | <code>string</code> | Secret to save |

**Example**  
```js
const request = {
   name: "my-secret",
   secret: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
};

secrets.createSecret(request)
.then(result => {
  console.log(result) // returns the GetSecretResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+listSecrets"></a>

### secrets.listSecrets(request) ⇒ <code>Promise.&lt;ListSecretResponse&gt;</code>
List all the secrets for current Project.

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

secrets.listSecrets(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e)); // an error occurred
```
<a name="Secrets+deleteSecret"></a>

### secrets.deleteSecret(name)
Removes a secret by name.

**Kind**: instance method of [<code>Secrets</code>](#Secrets)  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Secret name |

**Example**  
```js
secrets.deleteSecret("my-secret")
.then(() => {
  console.log("successful")
}).catch(e => console.error(e)); // an error occurred
```
