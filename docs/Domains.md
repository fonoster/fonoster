<a name="Domains"></a>

## Domains ⇐ <code>AbstractService</code>
Use YAPS Domains, a capability of YAPS SIP Proxy Subsystem,
to create, update,  get and delete domains. YAPS Domains requires of a
running YAPS deployment.

**Kind**: global class  
**Extends**: <code>AbstractService</code>  
**See**: module:core:AbstractService  

* [Domains](#Domains) ⇐ <code>AbstractService</code>
    * [new Domains()](#new_Domains_new)
    * [.createDomain(request)](#Domains+createDomain) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.deleteDomain(ref)](#Domains+deleteDomain)

<a name="new_Domains_new"></a>

### new Domains()
Constructs a new Domains object.

**Example**  
```js
const YAPS = require('@yaps/sdk')
const domains = new YAPS.Domains()

domains.create({name: 'Local Domain', domainUri: 'sip.local'...})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Domains+createDomain"></a>

### domains.createDomain(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Domain at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.name | <code>string</code> | Friendly name for the SIP domain |
| request.domainUri | <code>string</code> | Domain URI. FQDN is recommended |
| request.egressNumberRef | <code>string</code> | A valid reference to a Number in YAPS |
| request.egressRule | <code>string</code> | Regular expression indicating when a call will be routed via request.egressNumberRef |
| request.accessDeny | <code>string</code> | Optional list of IPs or networks that cannot communicate with this Domain |
| request.accessAllow | <code>string</code> | Optiona list of IPs or networks allow if request.accessDeny is defined |

**Example**  
```js
const request = {
   name: 'Local Domain',
   domainUri: 'sip.local',
   egressRule: '.*',
   egressNumberRef: '507f1f77bcf86cd799439011',
   accessDeny: ['0.0.0.0/1']     // Deny all
   accessAllow: ['192.168.1.0/255.255.255.0', '192.168.0.1/31']
}

appManager.createDomain(request)
.then(result => {
  console.log(result)            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Domains+deleteDomain"></a>

### domains.deleteDomain(ref)
Deletes a Domain from SIP Proxy subsystem. Notice, that in order to delete
a Domain, you must first delete all its Agents.

**Kind**: instance method of [<code>Domains</code>](#Domains)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Domain |

**Example**  
```js
const ref = '507f1f77bcf86cd799439011'

domains.deleteDomain(ref)
.then(() => {
  console.log('done')            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
