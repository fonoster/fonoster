<a name="CallManager"></a>

## CallManager ⇐ <code>APIClient</code>
Use Fonoster CallManager, a capability of Fonoster CallManager,
to initiate and monitor automated calls. Fonoster CallManager requires of a
running Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [CallManager](#CallManager) ⇐ <code>APIClient</code>
    * [new CallManager()](#new_CallManager_new)
    * [new CallManager()](#new_CallManager_new)
    * [new CallManager()](#new_CallManager_new)
    * [.call(request)](#CallManager+call) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
    * [.call(request)](#CallManager+call) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
    * [.call(request)](#CallManager+call) ⇒ <code>Promise.&lt;CallResponse&gt;</code>

<a name="new_CallManager_new"></a>

### new CallManager()
Constructs a new CallManager Object.

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const callManager = new Fonoster.CallManager()

callManager.call({
  from: "9102104343",
  to: "17853178070"
  app: "default"
})
.then(console.log)        // successful response
.catch(console.error)   // an error occurred
```
<a name="new_CallManager_new"></a>

### new CallManager()
Constructs a new CallManager Object.

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const callManager = new Fonoster.CallManager()

callManager.call({
  from: "9102104343",
  to: "17853178070"
  app: "default"
})
.then(console.log)        // successful response
.catch(console.error)   // an error occurred
```
<a name="new_CallManager_new"></a>

### new CallManager()
Constructs a new CallManager Object.

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const callManager = new Fonoster.CallManager()

callManager.call({
  from: "9102104343",
  to: "17853178070"
  app: "default"
})
.then(console.log)        // successful response
.catch(console.error)   // an error occurred
```
<a name="CallManager+call"></a>

### callManager.call(request) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
Call method.

**Kind**: instance method of [<code>CallManager</code>](#CallManager)  
**Returns**: <code>Promise.&lt;CallResponse&gt;</code> - - call results  
**Throws**:

- if the from number doesn't exist
- if could not connect to the underline services


| Param | Type | Description |
| --- | --- | --- |
| request | <code>CallRequest</code> | Call request options |
| request.from | <code>string</code> | Number you are calling from. You must have this Number configured in your account |
| request.to | <code>string</code> | The callee |
| request.webhook | <code>string</code> | Url of the application that will handle the call. If none is provided it will use the webook setup in the Number |
| request.ignoreE164Validation | <code>string</code> | If enabled it will accept any input in the from and to |

**Example**  
```js
callManager.call({
  from: "+19102104343",
  to: "+17853178070",
  webhook: "https://voiceapps.acme.com/myvoiceapp",
  metadata?: {}
})
.then(console.log)         // successful response
.catch(console.error);     // an error occurred
```
<a name="CallManager+call"></a>

### callManager.call(request) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
Call method.

**Kind**: instance method of [<code>CallManager</code>](#CallManager)  
**Returns**: <code>Promise.&lt;CallResponse&gt;</code> - - call results  
**Throws**:

- if the from number doesn't exist
- if could not connect to the underline services


| Param | Type | Description |
| --- | --- | --- |
| request | <code>CallRequest</code> | Call request options |
| request.from | <code>string</code> | Number you are calling from. You must have this Number configured in your account |
| request.to | <code>string</code> | The callee |
| request.webhook | <code>string</code> | Url of the application that will handle the call. If none is provided it will use the webook setup in the Number |
| request.ignoreE164Validation | <code>string</code> | If enabled it will accept any input in the from and to |

**Example**  
```js
callManager.call({
  from: "+19102104343",
  to: "+17853178070",
  webhook: "https://voiceapps.acme.com/myvoiceapp",
  metadata?: {}
})
.then(console.log)         // successful response
.catch(console.error);     // an error occurred
```
<a name="CallManager+call"></a>

### callManager.call(request) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
Call method.

**Kind**: instance method of [<code>CallManager</code>](#CallManager)  
**Returns**: <code>Promise.&lt;CallResponse&gt;</code> - - call results  
**Throws**:

- if the from number doesn't exist
- if could not connect to the underline services


| Param | Type | Description |
| --- | --- | --- |
| request | <code>CallRequest</code> | Call request options |
| request.from | <code>string</code> | Number you are calling from. You must have this Number configured in your account |
| request.to | <code>string</code> | The callee |
| request.webhook | <code>string</code> | Url of the application that will handle the call. If none is provided it will use the webook setup in the Number |
| request.ignoreE164Validation | <code>string</code> | If enabled it will accept any input in the from and to |

**Example**  
```js
callManager.call({
  from: "+19102104343",
  to: "+17853178070",
  webhook: "https://voiceapps.acme.com/myvoiceapp",
  metadata?: {}
})
.then(console.log)         // successful response
.catch(console.error);     // an error occurred
```
