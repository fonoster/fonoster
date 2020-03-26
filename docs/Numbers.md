<a name="Numbers"></a>

## Numbers
Use YAPS Numbers, is a capability of YAPS SIP Proxy Subsystem,
to create, update, get and delete Numbers. YAPS Domains requires of a
running YAPS deployment.

**Kind**: global class  
**See**: module:domains:Domains  

* [Numbers](#Numbers)
    * [new Numbers()](#new_Numbers_new)
    * [.createNumber(request)](#Numbers+createNumber) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getIngressApp(request)](#Numbers+getIngressApp) ⇒ <code>Promise.&lt;Object&gt;</code>

<a name="new_Numbers_new"></a>

### new Numbers()
Constructs a new Numbers object.

**Example**  
```js
const YAPS = require('@yaps/sdk')
const numbers = new YAPS.Numbers()

const request = {
   e164Number: '+17853178071',
   ingressApp: 'hello-monkeys'
}

numbers.createNumber(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Numbers+createNumber"></a>

### numbers.createNumber(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Number on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the application does not exist
- The number is not a valid E164


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format that you own |
| request.ingressApp | <code>string</code> | Name of a registered application incomming calls |

**Example**  
```js
const request = {
   e164Number: '+17853178071',
   ingressApp: 'hello-monkeys'
}

numbers.createNumber(request)
.then(result => {
  console.log(result)            // returns the Number you created
}).catch(e => console.error(e))  // an error occurred
```
<a name="Numbers+getIngressApp"></a>

### numbers.getIngressApp(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Get the Ingress App for a given Number.

**Kind**: instance method of [<code>Numbers</code>](#Numbers)  
**Throws**:

- if the Number is not register in YAPS


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.e164Number | <code>string</code> | A number in E164 format that you own incomming calls |

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
