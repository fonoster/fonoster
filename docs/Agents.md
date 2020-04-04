<a name="Agents"></a>

## Agents ⇐ <code>YAPSService</code>
Use YAPS Agents, a capability of YAPS SIP Proxy subsystem,
to create, update, get and delete Agents. YAPS Agents requires of a
running YAPS deployment.

**Kind**: global class  
**Extends**: <code>YAPSService</code>  
**See**: module:core:YAPSService  

* [Agents](#Agents) ⇐ <code>YAPSService</code>
    * [new Agents()](#new_Agents_new)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;Object&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent)

<a name="new_Agents_new"></a>

### new Agents()
Constructs a new Agents object.

**Example**  
```js
const YAPS = require('@yaps/sdk')
const agents = new YAPS.Agents()

const request = {
  name: 'John Doe',
  username: 'john',
  secret: '1234',
  domains: ['sip.local']
}

agents.createAgent(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Creates a new Agent on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The Agent from the database  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for the provision of a new Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.username | <code>string</code> | Agent's credential username |
| request.secret | <code>string</code> | Agent's credential secret |
| request.privacy | <code>Array.&lt;string&gt;</code> | If set to 'Private' YAPS removes identifiable information for the requests. Defaults to 'None' |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {
  name: 'John Doe',
  username: 'john',
  secret: '1234',
  domains: ['sip.local']
}

agents.createAgent(request)
.then(result => {
  console.log(result)            // returns the Agent object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives a Agent by its reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
agents.getAgent(ref)
.then(result => {
  console.log(result)             // returns the Agent object
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update a Agent at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The Agent from the database  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request update of an Agent |
| request.ref | <code>string</code> | Reference to the Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.secret | <code>string</code> | Agent's credential secret |

**Example**  
```js
const request = {
  name: 'John Dee',
  secret: '12345'
}

agents.updateAgent(request)
.then(result => {
  console.log(result)            // returns the Agent from the DB
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List the Agents registered in YAPS SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>agent</code> | Agent of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

agents.listAgents(request)
.then(() => {
  console.log(result)            // returns a ListAgentsResponse object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+deleteAgent"></a>

### agents.deleteAgent(ref)
Deletes a Agent from SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to the Agent |

**Example**  
```js
const ref = '507f1f77bcf86cd799439011'

agents.deleteAgent(ref)
.then(() => {
  console.log('done')            // returns an empty object
}).catch(e => console.error(e))  // an error occurred
```
