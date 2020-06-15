<a name="Numbers"></a>

## Numbers ⇐ <code>FonosService</code>
Use Fonos Numbers, a capability of Fonos SIP Proxy subsystem,
to create, update, get and delete numbers. Fonos Numbers requires of a
running Fonos deployment.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [Numbers](#Numbers) ⇐ <code>FonosService</code>
    * [new Numbers()](#new_Numbers_new)
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;Number&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;Number&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;Number&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;Number&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressApp(request)](#Numbers+getIngressApp) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_Numbers_new"></a>

### new Numbers()
Constructs a new Numbers object.

**Example**  
```js
const Fonos = require('@fonos/sdk')
const numbers = new Fonos.Numbers()

const request = {
  providerRef: '516f1577bcf86cd797439012',
  e164Number: '+17853177343',
  ingressApp: 'hello-monkeys'
}

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;Number&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164_number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingress_app | <code>string</code> | An Application where ingress calls will be directed to |

**Example**  
```js
const request = {
  providerRef: '516f1577bcf86cd797439012',
  e164Number: '+17853177343',
  aorLink: 'sip:1001@sip.local'
}

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the Number object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;Number&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;Number&gt;</code> - The number  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the Number object
}).catch(e => console.error(e))   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;Number&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingress_app | <code>string</code> | An Application where ingress calls will be directed to |

**Example**  
```js
const request = {
  ref: '516f1577bcf86cd797439012',
  aorLink: 'sip:1001@sip.local'
}

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;Number&gt;</code>
List the Numbers registered in Fonos SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;Number&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+deleteNumber"></a>

### numbers.deleteNumber(ref)
Deletes a Number from SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Number |

**Example**  
```js
const ref = '507f1f77bcf86cd799439011'

numbers.deleteNumber(ref)
.then(() => {
  console.log('done')            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressApp"></a>

### numbers.getIngressApp(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonos


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: '+17853178071'
}

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e))  // an error occurred
```
