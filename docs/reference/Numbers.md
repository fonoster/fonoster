<a name="Numbers"></a>

## Numbers ⇐ <code>APIClient</code>
Use Fonoster Numbers, a capability of Fonoster SIP Proxy subsystem,
to create, update, get and delete numbers. Fonoster Numbers requires of a
running Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Numbers](#Numbers) ⇐ <code>APIClient</code>
    * [new Numbers(options)](#new_Numbers_new)
    * [new Numbers(options)](#new_Numbers_new)
    * [new Numbers(options)](#new_Numbers_new)
    * [new Numbers(options)](#new_Numbers_new)
    * [new Numbers(options)](#new_Numbers_new)
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressInfo(request)](#Numbers+getIngressInfo) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressInfo(request)](#Numbers+getIngressInfo) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressInfo(request)](#Numbers+getIngressInfo) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressInfo(request)](#Numbers+getIngressInfo) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
    * [.getNumber(ref)](#Numbers+getNumber) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
    * [.updateNumber(request)](#Numbers+updateNumber) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
    * [.listNumbers(request)](#Numbers+listNumbers) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
    * [.deleteNumber(ref)](#Numbers+deleteNumber)
    * [.getIngressInfo(request)](#Numbers+getIngressInfo) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>

<a name="new_Numbers_new"></a>

### new Numbers(options)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const numbers = new Fonoster.Numbers();

const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  ingressInfo: {
     webhook: "https://webhooks.acme.com/hooks"
  }
};

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Numbers_new"></a>

### new Numbers(options)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const numbers = new Fonoster.Numbers();

const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  ingressInfo: {
     webhook: "https://webhooks.acme.com/hooks"
  }
};

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Numbers_new"></a>

### new Numbers(options)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const numbers = new Fonoster.Numbers();

const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  ingressInfo: {
     webhook: "https://webhooks.acme.com/hooks"
  }
};

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Numbers_new"></a>

### new Numbers(options)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const numbers = new Fonoster.Numbers();

const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  ingressInfo: {
     webhook: "https://webhooks.acme.com/hooks"
  }
};

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Numbers_new"></a>

### new Numbers(options)
Constructs a new Numbers object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const numbers = new Fonoster.Numbers();

const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  ingressInfo: {
     webhook: "https://webhooks.acme.com/hooks"
  }
};

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressInfo but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164Number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | Webhook to connect call to |

**Example**  
```js
const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  aorLink: "sip:1001@sip.local"
};

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the CreateNumberResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;GetNumberResponse&gt;</code> - The GetNumberResponse  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the GetNumberResponse object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | A webhook to direct the call for flow control |

**Example**  
```js
const request = {
  ref: "516f1577bcf86cd797439012",
  aorLink: "sip:1001@sip.local"
};

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
List the Numbers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e));  // an error occurred
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
const ref = "cb8V0CNTfH";

numbers.deleteNumber(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressInfo"></a>

### numbers.getIngressInfo(request) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonoster


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetIngressAppRequest</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: "+17853178071"
};

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressInfo but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164Number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | Webhook to connect call to |

**Example**  
```js
const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  aorLink: "sip:1001@sip.local"
};

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the CreateNumberResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;GetNumberResponse&gt;</code> - The GetNumberResponse  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the GetNumberResponse object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | A webhook to direct the call for flow control |

**Example**  
```js
const request = {
  ref: "516f1577bcf86cd797439012",
  aorLink: "sip:1001@sip.local"
};

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
List the Numbers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e));  // an error occurred
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
const ref = "cb8V0CNTfH";

numbers.deleteNumber(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressInfo"></a>

### numbers.getIngressInfo(request) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonoster


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetIngressAppRequest</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: "+17853178071"
};

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressInfo but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164Number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | Webhook to connect call to |

**Example**  
```js
const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  aorLink: "sip:1001@sip.local"
};

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the CreateNumberResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;GetNumberResponse&gt;</code> - The GetNumberResponse  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the GetNumberResponse object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | A webhook to direct the call for flow control |

**Example**  
```js
const request = {
  ref: "516f1577bcf86cd797439012",
  aorLink: "sip:1001@sip.local"
};

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
List the Numbers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e));  // an error occurred
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
const ref = "cb8V0CNTfH";

numbers.deleteNumber(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressInfo"></a>

### numbers.getIngressInfo(request) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonoster


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetIngressAppRequest</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: "+17853178071"
};

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressInfo but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164Number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | Webhook to connect call to |

**Example**  
```js
const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  aorLink: "sip:1001@sip.local"
};

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the CreateNumberResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;GetNumberResponse&gt;</code> - The GetNumberResponse  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the GetNumberResponse object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | A webhook to direct the call for flow control |

**Example**  
```js
const request = {
  ref: "516f1577bcf86cd797439012",
  aorLink: "sip:1001@sip.local"
};

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
List the Numbers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e));  // an error occurred
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
const ref = "cb8V0CNTfH";

numbers.deleteNumber(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressInfo"></a>

### numbers.getIngressInfo(request) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonoster


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetIngressAppRequest</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: "+17853178071"
};

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;CreateNumberResponse&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressInfo but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateNumberRequest</code> | Request for the provision of a new Number |
| request.providerRef | <code>string</code> | Idenfier to the Provider this Number belongs with |
| request.e164Number | <code>string</code> | A valid number @ Provider |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | Webhook to connect call to |

**Example**  
```js
const request = {
  providerRef: "516f1577bcf86cd797439012",
  e164Number: "+17853177343",
  aorLink: "sip:1001@sip.local"
};

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the CreateNumberResponse interface
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+getNumber"></a>

### numbers.getNumber(ref) ⇒ <code>Promise.&lt;GetNumberResponse&gt;</code>
Retrives a Number by its reference.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;GetNumberResponse&gt;</code> - The GetNumberResponse  
**Throws**:

- if ref is null or Number does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Number |

**Example**  
```js
numbers.getNumber(ref)
.then(result => {
  console.log(result)             // returns the GetNumberResponse object
}).catch(e => console.error(e));   // an error occurred
```
<a name="Numbers+updateNumber"></a>

### numbers.updateNumber(request) ⇒ <code>Promise.&lt;UpdateNumberResponse&gt;</code>
Update a Number at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Note**: You can only provider an aorLink or an ingressApp but no both  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateNumberRequest</code> | Request for the update of an existing Number |
| request.aorLink | <code>string</code> | An AOR where ingress calls will be directed to |
| request.ingressInfo | <code>string</code> | A webhook to direct the call for flow control |

**Example**  
```js
const request = {
  ref: "516f1577bcf86cd797439012",
  aorLink: "sip:1001@sip.local"
};

numbers.updateNumber(request)
.then(result => {
  console.log(result)            // returns the Number from the DB
}).catch(e => console.error(e));  // an error occurred
```
<a name="Numbers+listNumbers"></a>

### numbers.listNumbers(request) ⇒ <code>Promise.&lt;ListNumbersResponse&gt;</code>
List the Numbers registered in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Returns**: <code>Promise.&lt;ListNumbersResponse&gt;</code> - List of Numbers  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListNumbersRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

numbers.listNumbers(request)
.then(() => {
  console.log(result)            // returns a ListNumbersResponse object
}).catch(e => console.error(e));  // an error occurred
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
const ref = "cb8V0CNTfH";

numbers.deleteNumber(ref)
.then(() => {
  console.log("done")            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressInfo"></a>

### numbers.getIngressInfo(request) ⇒ <code>Promise.&lt;GetIngressAppResponse&gt;</code>
Get the Ingress App for a given e164 number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in Fonoster


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetIngressAppRequest</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format for incomming calls |

**Example**  
```js
const request = {
   e164Number: "+17853178071"
};

numbers.getIngressApp(request)
.then(result => {
  console.log(result)            // returns the Application
}).catch(e => console.error(e));  // an error occurred
```
