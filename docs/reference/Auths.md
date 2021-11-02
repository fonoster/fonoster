<a name="Auths"></a>

## Auths ⇐ <code>APIClient</code>
Use Fonoster Auth, a capability of Fonoster,
to validate and create short life tokens.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Auths](#Auths) ⇐ <code>APIClient</code>
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [new Auths(options)](#new_Auths_new)
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>
    * [.createToken(request)](#Auths+createToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.createNoAccessToken(request)](#Auths+createNoAccessToken) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
    * [.validateToken(request)](#Auths+validateToken) ⇒ <code>Promise.&lt;boolean&gt;</code>

<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="new_Auths_new"></a>

### new Auths(options)
Constructs a new Auth object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "ROLE"
};

auth.createToken(request)
.then(console.log)       // returns an object with the token
.catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
<a name="Auths+createToken"></a>

### auths.createToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token. The client must have role allowed to create
tokens.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new token |
| request.accessKeyId | <code>string</code> | Path to the function |
| request.expiration | <code>string</code> | Longevity of the token |
| request.roleName | <code>string</code> | Role assigned to the token |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
  roleName: "SERVICE",
  expirantion: '10m'
};

auth.createToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+createNoAccessToken"></a>

### auths.createNoAccessToken(request) ⇒ <code>Promise.&lt;CreateTokenResponse&gt;</code>
Creates a short-life token meant only to serve as a signature. This token will
only be useful to sign a request.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokenRequest</code> | Request to create a new signature token |
| request.accessKeyId | <code>string</code> | Path to the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  accessKeyId: "603693c0afaa1a080000000e",
};

auth.createNoAccessToken(request)
 .then(console.log)       // returns an object with the token
 .catch(console.error);   // an error occurred
```
<a name="Auths+validateToken"></a>

### auths.validateToken(request) ⇒ <code>Promise.&lt;boolean&gt;</code>
Checks if a give token was issue by the system.

**Kind**: instance method of [<code>Auths</code>](#Auths)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateTokValidateTokenRequestenRequest</code> | Request to verify the validity of a token |
| request.token | <code>string</code> | Path to the function. |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const auth = new Fonoster.Auth();

const request = {
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
};

auth.validateToken(request)
 .then(console.log)       // returns `true` or `false`
 .catch(console.error);   // an error occurred
```
