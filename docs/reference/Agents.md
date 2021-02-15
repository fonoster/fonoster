<a name="Agents"></a>

## Agents ⇐ <code>FonosService</code>
Use Fonos Agents, a capability of Fonos SIP Proxy subsystem,to create, update, get and delete Agents. Agents requires of arunning Fonos deployment.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [Agents](#Agents) ⇐ <code>FonosService</code>
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
const Fonos = require('@fonos/sdk')const agents = new Fonos.Agents()const request = {  name: 'John Doe',  username: 'john',  secret: '1234',  domains: ['sip.local']}agents.createAgent(request).then(result => {  console.log(result)             // successful response}).catch(e => console.error(e))   // an error occurred
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
| request.privacy | <code>Array.&lt;string&gt;</code> | If set to 'Private' Fonos removes identifiable information for the requests. Defaults to 'None' |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {  name: 'John Doe',  username: 'john',  secret: '1234',  domains: ['sip.local']}agents.createAgent(request).then(result => {  console.log(result)            // returns the Agent object}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;Object&gt;</code>
Retrives an Agent by reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;Object&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
agents.getAgent(ref).then(result => {  console.log(result)             // returns the Agent object}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;Object&gt;</code>
Update an Agent at the SIP Proxy subsystem.

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
const request = {  name: 'John Dee',  secret: '12345'}agents.updateAgent(request).then(result => {  console.log(result)            // returns the Agent from the DB}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List registered Agents in Fonos SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>agent</code> | Elements per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {   pageSize: 20,   pageToken: 2}agents.listAgents(request).then(() => {  console.log(result)            // returns a ListAgentsResponse object}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+deleteAgent"></a>

### agents.deleteAgent(ref)
Deletes an Agent from the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Agent's reference |

**Example**  
```js
const ref = '507f1f77bcf86cd799439011'agents.deleteAgent(ref).then(() => {  console.log('done')            // returns an empty object}).catch(e => console.error(e))  // an error occurred
```
