<a name="Domains"></a>

## Domains ⇐ <code>APIClient</code>
Use Fonoster Domains, a capability of Fonoster SIP Proxy Subsystem,
to create, update, get and delete Domains. The API requires of a running
Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Domains](#Domains) ⇐ <code>APIClient</code>
    * [new Domains(options)](#new_Domains_new)
    * [new Domains(options)](#new_Domains_new)
    * [new Domains(options)](#new_Domains_new)
    * [new Domains(options)](#new_Domains_new)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
    * [.getDomain(ref)](#Domains+getDomain) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
    * [.updateDomain(request)](#Domains+updateDomain) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
    * [.listDomains(request)](#Domains+listDomains) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
    * [.getDomain(ref)](#Domains+getDomain) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
    * [.updateDomain(request)](#Domains+updateDomain) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
    * [.listDomains(request)](#Domains+listDomains) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
    * [.getDomain(ref)](#Domains+getDomain) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
    * [.updateDomain(request)](#Domains+updateDomain) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
    * [.listDomains(request)](#Domains+listDomains) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
    * [.getDomain(ref)](#Domains+getDomain) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
    * [.updateDomain(request)](#Domains+updateDomain) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
    * [.listDomains(request)](#Domains+listDomains) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain)

<a name="new_Domains_new"></a>

### new Domains(options)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const domains = new Fonoster.Domains();

domains.createDomain({name: "Local Domain", domainUri: "sip.local"...})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Domains_new"></a>

### new Domains(options)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const domains = new Fonoster.Domains();

domains.createDomain({name: "Local Domain", domainUri: "sip.local"...})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Domains_new"></a>

### new Domains(options)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const domains = new Fonoster.Domains();

domains.createDomain({name: "Local Domain", domainUri: "sip.local"...})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Domains_new"></a>

### new Domains(options)
Constructs a new Domains object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const domains = new Fonoster.Domains();

domains.createDomain({name: "Local Domain", domainUri: "sip.local"...})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
Creates a new Domain on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateDomainRequest</code> | Request for the provision of a new Domain |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.domainUri | <code>string</code> | Domain URI. FQDN is recommended |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optional list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   name: "Local Domain",
   domainUri: "sip.local",
   egressRule: ".*",
   egressNumberRef: "cb8V0CNTfH",
   accessDeny: ["0.0.0.0/1"]     // Deny all
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.createDomain(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+getDomain"></a>

### domains.getDomain(ref) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
Retrives a Domain by its reference.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;GetDomainResponse&gt;</code> - The domain  
**Throws**:

- if ref is null or Domain does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Domain |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.getDomain(ref)
.then(result => {
  console.log(result) // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+updateDomain"></a>

### domains.updateDomain(request) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
Update a Domain at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateDomainRequest</code> | Request for the update of an existing Domain |
| request.ref | <code>string</code> | To update a Domain you must provide its reference |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optiona list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   ref: "Nx05y-ldZa",
   name: "Office Domain",
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.updateDomain(request)
.then(result => {
  console.log(result) // returns the UpdateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+listDomains"></a>

### domains.listDomains(request) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
List the Domains registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;ListDomainsResponse&gt;</code> - Paginated list of Domains  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListDomainsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

domains.listDomains(request)
.then(() => {
  console.log(result)            // returns a ListDomainsResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref)
Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
a Domain, you must first delete all it's Agents.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Domain you wish to delete |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.deleteDomain(ref)
.then(() => {
  console.log("done")            // returns a reference of the domain
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
Creates a new Domain on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateDomainRequest</code> | Request for the provision of a new Domain |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.domainUri | <code>string</code> | Domain URI. FQDN is recommended |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optional list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   name: "Local Domain",
   domainUri: "sip.local",
   egressRule: ".*",
   egressNumberRef: "cb8V0CNTfH",
   accessDeny: ["0.0.0.0/1"]     // Deny all
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.createDomain(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+getDomain"></a>

### domains.getDomain(ref) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
Retrives a Domain by its reference.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;GetDomainResponse&gt;</code> - The domain  
**Throws**:

- if ref is null or Domain does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Domain |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.getDomain(ref)
.then(result => {
  console.log(result) // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+updateDomain"></a>

### domains.updateDomain(request) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
Update a Domain at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateDomainRequest</code> | Request for the update of an existing Domain |
| request.ref | <code>string</code> | To update a Domain you must provide its reference |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optiona list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   ref: "Nx05y-ldZa",
   name: "Office Domain",
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.updateDomain(request)
.then(result => {
  console.log(result) // returns the UpdateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+listDomains"></a>

### domains.listDomains(request) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
List the Domains registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;ListDomainsResponse&gt;</code> - Paginated list of Domains  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListDomainsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

domains.listDomains(request)
.then(() => {
  console.log(result)            // returns a ListDomainsResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref)
Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
a Domain, you must first delete all it's Agents.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Domain you wish to delete |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.deleteDomain(ref)
.then(() => {
  console.log("done")            // returns a reference of the domain
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
Creates a new Domain on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateDomainRequest</code> | Request for the provision of a new Domain |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.domainUri | <code>string</code> | Domain URI. FQDN is recommended |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optional list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   name: "Local Domain",
   domainUri: "sip.local",
   egressRule: ".*",
   egressNumberRef: "cb8V0CNTfH",
   accessDeny: ["0.0.0.0/1"]     // Deny all
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.createDomain(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+getDomain"></a>

### domains.getDomain(ref) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
Retrives a Domain by its reference.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;GetDomainResponse&gt;</code> - The domain  
**Throws**:

- if ref is null or Domain does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Domain |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.getDomain(ref)
.then(result => {
  console.log(result) // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+updateDomain"></a>

### domains.updateDomain(request) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
Update a Domain at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateDomainRequest</code> | Request for the update of an existing Domain |
| request.ref | <code>string</code> | To update a Domain you must provide its reference |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optiona list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   ref: "Nx05y-ldZa",
   name: "Office Domain",
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.updateDomain(request)
.then(result => {
  console.log(result) // returns the UpdateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+listDomains"></a>

### domains.listDomains(request) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
List the Domains registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;ListDomainsResponse&gt;</code> - Paginated list of Domains  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListDomainsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

domains.listDomains(request)
.then(() => {
  console.log(result)            // returns a ListDomainsResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref)
Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
a Domain, you must first delete all it's Agents.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Domain you wish to delete |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.deleteDomain(ref)
.then(() => {
  console.log("done")            // returns a reference of the domain
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;CreateDomainResponse&gt;</code>
Creates a new Domain on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateDomainRequest</code> | Request for the provision of a new Domain |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.domainUri | <code>string</code> | Domain URI. FQDN is recommended |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optional list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   name: "Local Domain",
   domainUri: "sip.local",
   egressRule: ".*",
   egressNumberRef: "cb8V0CNTfH",
   accessDeny: ["0.0.0.0/1"]     // Deny all
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.createDomain(request)
.then(result => {
  console.log(result) // returns the CreateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+getDomain"></a>

### domains.getDomain(ref) ⇒ <code>Promise.&lt;GetDomainResponse&gt;</code>
Retrives a Domain by its reference.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;GetDomainResponse&gt;</code> - The domain  
**Throws**:

- if ref is null or Domain does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Domain |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.getDomain(ref)
.then(result => {
  console.log(result) // returns the CreateGetResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+updateDomain"></a>

### domains.updateDomain(request) ⇒ <code>Promise.&lt;UpdateDomainResponse&gt;</code>
Update a Domain at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateDomainRequest</code> | Request for the update of an existing Domain |
| request.ref | <code>string</code> | To update a Domain you must provide its reference |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in Fonos |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optiona list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   ref: "Nx05y-ldZa",
   name: "Office Domain",
   accessAllow: ["192.168.1.0/255.255.255.0", "192.168.0.1/31"]
};

domains.updateDomain(request)
.then(result => {
  console.log(result) // returns the UpdateDomainResponse interface
}).catch(e => console.error(e)); // an error occurred
```
<a name="Domains+listDomains"></a>

### domains.listDomains(request) ⇒ <code>Promise.&lt;ListDomainsResponse&gt;</code>
List the Domains registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  
**Returns**: <code>Promise.&lt;ListDomainsResponse&gt;</code> - Paginated list of Domains  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListDomainsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

domains.listDomains(request)
.then(() => {
  console.log(result)            // returns a ListDomainsResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref)
Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
a Domain, you must first delete all it's Agents.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Domain you wish to delete |

**Example**  
```js
const ref = "Nx05y-ldZa";

domains.deleteDomain(ref)
.then(() => {
  console.log("done")            // returns a reference of the domain
}).catch(e => console.error(e));  // an error occurred
```
