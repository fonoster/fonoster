<a name="Providers"></a>

## Providers ⇐ <code>APIClient</code>
Use Fonoster Providers, a capability of Fonoster SIP Proxy subsystem,
to create, update, get and delete providers. Fonoster Providers requires of a
running Fonosterdeployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Providers](#Providers) ⇐ <code>APIClient</code>
    * [new Providers(options)](#new_Providers_new)
    * [new Providers(options)](#new_Providers_new)
    * [new Providers(options)](#new_Providers_new)
    * [new Providers(options)](#new_Providers_new)
    * [.createProvider(request)](#Providers+createProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getProvider(ref)](#Providers+getProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.updateProvider(request)](#Providers+updateProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.listProviders(request)](#Providers+listProviders) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
    * [.deleteProvider(ref)](#Providers+deleteProvider)
    * [.createProvider(request)](#Providers+createProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getProvider(ref)](#Providers+getProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.updateProvider(request)](#Providers+updateProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.listProviders(request)](#Providers+listProviders) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
    * [.deleteProvider(ref)](#Providers+deleteProvider)
    * [.createProvider(request)](#Providers+createProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getProvider(ref)](#Providers+getProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.updateProvider(request)](#Providers+updateProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.listProviders(request)](#Providers+listProviders) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
    * [.deleteProvider(ref)](#Providers+deleteProvider)
    * [.createProvider(request)](#Providers+createProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getProvider(ref)](#Providers+getProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.updateProvider(request)](#Providers+updateProvider) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.listProviders(request)](#Providers+listProviders) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
    * [.deleteProvider(ref)](#Providers+deleteProvider)

<a name="new_Providers_new"></a>

### new Providers(options)
Constructs a new Providers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const providers = new Fonoster.Providers();

const request = {
  name: "SIP Provider",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Providers_new"></a>

### new Providers(options)
Constructs a new Providers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const providers = new Fonoster.Providers();

const request = {
  name: "SIP Provider",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Providers_new"></a>

### new Providers(options)
Constructs a new Providers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const providers = new Fonoster.Providers();

const request = {
  name: "SIP Provider",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Providers_new"></a>

### new Providers(options)
Constructs a new Providers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const providers = new Fonoster.Providers();

const request = {
  name: "SIP Provider",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="Providers+createProvider"></a>

### providers.createProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Provider on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Provider |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  name: "Provider Name",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)            // returns the Provider object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+getProvider"></a>

### providers.getProvider(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives a Provider by its reference.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The provider  
**Throws**:

- if ref is null or Provider does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Provider |

**Example**  
```js
providers.getProvider(ref)
.then(result => {
  console.log(result)             // returns the Provider object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Providers+updateProvider"></a>

### providers.updateProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update a Provider at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request to update a Provider |
| request.ref | <code>string</code> | Providers reference |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  ref: "hYTHYCYv_U",
  host: "sip.provider.net"
};

providers.updateProvider(request)
.then(result => {
  console.log(result)            // returns the Provider from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+listProviders"></a>

### providers.listProviders(request) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
List the Providers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;ListProvidersResponse&gt;</code> - List of Providers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>provider</code> | Provider of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

providers.listProviders(request)
.then(() => {
  console.log(result)            // returns a ListProvidersResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+deleteProvider"></a>

### providers.deleteProvider(ref)
Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
a Provider, you must first delete all it"s Agents.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Provider |

**Example**  
```js
const ref = "hYTHYCYv_U";

providers.deleteProvider(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+createProvider"></a>

### providers.createProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Provider on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Provider |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  name: "Provider Name",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)            // returns the Provider object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+getProvider"></a>

### providers.getProvider(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives a Provider by its reference.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The provider  
**Throws**:

- if ref is null or Provider does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Provider |

**Example**  
```js
providers.getProvider(ref)
.then(result => {
  console.log(result)             // returns the Provider object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Providers+updateProvider"></a>

### providers.updateProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update a Provider at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request to update a Provider |
| request.ref | <code>string</code> | Providers reference |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  ref: "hYTHYCYv_U",
  host: "sip.provider.net"
};

providers.updateProvider(request)
.then(result => {
  console.log(result)            // returns the Provider from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+listProviders"></a>

### providers.listProviders(request) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
List the Providers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;ListProvidersResponse&gt;</code> - List of Providers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>provider</code> | Provider of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

providers.listProviders(request)
.then(() => {
  console.log(result)            // returns a ListProvidersResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+deleteProvider"></a>

### providers.deleteProvider(ref)
Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
a Provider, you must first delete all it"s Agents.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Provider |

**Example**  
```js
const ref = "hYTHYCYv_U";

providers.deleteProvider(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+createProvider"></a>

### providers.createProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Provider on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Provider |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  name: "Provider Name",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)            // returns the Provider object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+getProvider"></a>

### providers.getProvider(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives a Provider by its reference.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The provider  
**Throws**:

- if ref is null or Provider does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Provider |

**Example**  
```js
providers.getProvider(ref)
.then(result => {
  console.log(result)             // returns the Provider object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Providers+updateProvider"></a>

### providers.updateProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update a Provider at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request to update a Provider |
| request.ref | <code>string</code> | Providers reference |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  ref: "hYTHYCYv_U",
  host: "sip.provider.net"
};

providers.updateProvider(request)
.then(result => {
  console.log(result)            // returns the Provider from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+listProviders"></a>

### providers.listProviders(request) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
List the Providers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;ListProvidersResponse&gt;</code> - List of Providers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>provider</code> | Provider of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

providers.listProviders(request)
.then(() => {
  console.log(result)            // returns a ListProvidersResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+deleteProvider"></a>

### providers.deleteProvider(ref)
Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
a Provider, you must first delete all it"s Agents.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Provider |

**Example**  
```js
const ref = "hYTHYCYv_U";

providers.deleteProvider(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+createProvider"></a>

### providers.createProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Provider on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Provider |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  name: "Provider Name",
  username: "trunk001",
  secret: "secretkey",
  host: "sip.provider.net"
};

providers.createProvider(request)
.then(result => {
  console.log(result)            // returns the Provider object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+getProvider"></a>

### providers.getProvider(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives a Provider by its reference.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The provider  
**Throws**:

- if ref is null or Provider does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Provider |

**Example**  
```js
providers.getProvider(ref)
.then(result => {
  console.log(result)             // returns the Provider object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Providers+updateProvider"></a>

### providers.updateProvider(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update a Provider at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request to update a Provider |
| request.ref | <code>string</code> | Providers reference |
| request.name | <code>string</code> | Friendly name to the Provider |
| request.username | <code>string</code> | Username for the trunk. No required for static IP authentication |
| request.secret | <code>string</code> | Password for the trunk. No required for static IP authentication |
| request.host | <code>string</code> | Hostname or IP of the Provider |
| request.transport | <code>string</code> | The transport for the Provider. Fonoster will use TCP if none is provided |
| request.expires | <code>string</code> | Expiration time for the registration. Fonoster will use 3600 if non is provided |

**Example**  
```js
const request = {
  ref: "hYTHYCYv_U",
  host: "sip.provider.net"
};

providers.updateProvider(request)
.then(result => {
  console.log(result)            // returns the Provider from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+listProviders"></a>

### providers.listProviders(request) ⇒ <code>Promise.&lt;ListProvidersResponse&gt;</code>
List the Providers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Providers</code>](#Providers)  
**Returns**: <code>Promise.&lt;ListProvidersResponse&gt;</code> - List of Providers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>provider</code> | Provider of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

providers.listProviders(request)
.then(() => {
  console.log(result)            // returns a ListProvidersResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Providers+deleteProvider"></a>

### providers.deleteProvider(ref)
Deletes a Provider from SIP Proxy subsystem. Notice, that in order to delete
a Provider, you must first delete all it"s Agents.

**Kind**: instance method of [<code>Providers</code>](#Providers)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Provider |

**Example**  
```js
const ref = "hYTHYCYv_U";

providers.deleteProvider(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e));  // an error occurred
```
