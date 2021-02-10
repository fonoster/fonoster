<a name="CallManager"></a>

## CallManager ⇐ <code>FonosService</code>
Use Fonos CallManager, a capability of Fonos Systems Manager,
to initiate and monitor automated calls. Fonos CallManager requires of a
running Fonos deployment.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [CallManager](#CallManager) ⇐ <code>FonosService</code>
    * [new CallManager()](#new_CallManager_new)
    * [.call(request)](#CallManager+call) ⇒ <code>Promise.&lt;CallResponse&gt;</code>

<a name="new_CallManager_new"></a>

### new CallManager()
Constructs a new CallManager Object.

**Example**  
```js
const Fonos = require('@fonos/sdk')
const callManager = new Fonos.CallManager()

callManager.call({
  from: '9102104343',
  to: '17853178070'
  app: 'default'
})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="CallManager+call"></a>

### callManager.call(request) ⇒ <code>Promise.&lt;CallResponse&gt;</code>
Calls method.

**Kind**: instance method of [<code>CallManager</code>](#CallManager)  
**Returns**: <code>Promise.&lt;CallResponse&gt;</code> - call results  
**Throws**:

- if the from number doesn't exist
- if could not connect to the underline services


| Param | Type | Description |
| --- | --- | --- |
| request | <code>CallRequest</code> | call options. |

**Example**  
```js
callManager.call({
  from: '9102104343',
  to: '17853178070'
  app: 'default'
})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
