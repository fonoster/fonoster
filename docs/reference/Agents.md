<a name="Agents"></a>

## Agents ⇐ <code>APIClient</code>
Use Fonoster Agents, a capability ofFonosterSIP Proxy subsystem,
to create, update, get and delete Agents. Agents requires of a
runningFonosterdeployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Agents](#Agents) ⇐ <code>APIClient</code>
    * [new Agents(options)](#new_Agents_new)
    * [new Agents(options)](#new_Agents_new)
    * [new Agents(options)](#new_Agents_new)
    * [new Agents(options)](#new_Agents_new)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent)
    * [.createAgent(request)](#Agents+createAgent) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
    * [.getAgent(ref)](#Agents+getAgent) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
    * [.updateAgent(request)](#Agents+updateAgent) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
    * [.listAgents(request)](#Agents+listAgents) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
    * [.deleteAgent(ref)](#Agents+deleteAgent)

<a name="new_Agents_new"></a>

### new Agents(options)
Constructs a new Agents object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const agents = new Fonoster.Agents()

const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Agents_new"></a>

### new Agents(options)
Constructs a new Agents object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const agents = new Fonoster.Agents()

const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Agents_new"></a>

### new Agents(options)
Constructs a new Agents object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const agents = new Fonoster.Agents()

const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Agents_new"></a>

### new Agents(options)
Constructs a new Agents object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const agents = new Fonoster.Agents()

const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
Creates a new Agent on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAgentRequest</code> | Request for the provision of a new Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.username | <code>string</code> | Agent's credential username |
| request.secret | <code>string</code> | Agent's credential secret |
| request.privacy | <code>string</code> | If set to "Private" Fonoster removes identifiable information for the requests. Defaults to "None" |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)            // returns the CreateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
Retrives an Agent by reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;GetAgentResponse&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

agents.getAgent(ref)
.then(result => {
  console.log(result)             // returns the GetAgentResponse interface
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
Update an Agent at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAgentRequest</code> | Request update of an Agent |
| request.ref | <code>string</code> | Reference to the Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.secret | <code>string</code> | Agent's credential secret |

**Example**  
```js
const request = {
  name: "John Dee",
  secret: "12345"
}

agents.updateAgent(request)
.then(result => {
  console.log(result)            // returns the UpdateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List registered Agents in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - Paginated List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAgentsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Elements per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

agents.listAgents(request)
.then(() => {
  console.log(result)            // returns a ListAgentsResponse interface
}).catch(e => console.error(e))  // an error occurred
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
const ref = "507f1f77bcf86cd799439011"

agents.deleteAgent(ref)
.then(() => {
  console.log("done")            // returns a reference of the agent
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
Creates a new Agent on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAgentRequest</code> | Request for the provision of a new Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.username | <code>string</code> | Agent's credential username |
| request.secret | <code>string</code> | Agent's credential secret |
| request.privacy | <code>string</code> | If set to "Private" Fonoster removes identifiable information for the requests. Defaults to "None" |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)            // returns the CreateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
Retrives an Agent by reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;GetAgentResponse&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

agents.getAgent(ref)
.then(result => {
  console.log(result)             // returns the GetAgentResponse interface
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
Update an Agent at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAgentRequest</code> | Request update of an Agent |
| request.ref | <code>string</code> | Reference to the Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.secret | <code>string</code> | Agent's credential secret |

**Example**  
```js
const request = {
  name: "John Dee",
  secret: "12345"
}

agents.updateAgent(request)
.then(result => {
  console.log(result)            // returns the UpdateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List registered Agents in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - Paginated List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAgentsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Elements per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

agents.listAgents(request)
.then(() => {
  console.log(result)            // returns a ListAgentsResponse interface
}).catch(e => console.error(e))  // an error occurred
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
const ref = "507f1f77bcf86cd799439011"

agents.deleteAgent(ref)
.then(() => {
  console.log("done")            // returns a reference of the agent
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
Creates a new Agent on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAgentRequest</code> | Request for the provision of a new Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.username | <code>string</code> | Agent's credential username |
| request.secret | <code>string</code> | Agent's credential secret |
| request.privacy | <code>string</code> | If set to "Private" Fonoster removes identifiable information for the requests. Defaults to "None" |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)            // returns the CreateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
Retrives an Agent by reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;GetAgentResponse&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

agents.getAgent(ref)
.then(result => {
  console.log(result)             // returns the GetAgentResponse interface
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
Update an Agent at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAgentRequest</code> | Request update of an Agent |
| request.ref | <code>string</code> | Reference to the Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.secret | <code>string</code> | Agent's credential secret |

**Example**  
```js
const request = {
  name: "John Dee",
  secret: "12345"
}

agents.updateAgent(request)
.then(result => {
  console.log(result)            // returns the UpdateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List registered Agents in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - Paginated List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAgentsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Elements per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

agents.listAgents(request)
.then(() => {
  console.log(result)            // returns a ListAgentsResponse interface
}).catch(e => console.error(e))  // an error occurred
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
const ref = "507f1f77bcf86cd799439011"

agents.deleteAgent(ref)
.then(() => {
  console.log("done")            // returns a reference of the agent
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+createAgent"></a>

### agents.createAgent(request) ⇒ <code>Promise.&lt;CreateAgentResponse&gt;</code>
Creates a new Agent on the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateAgentRequest</code> | Request for the provision of a new Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.username | <code>string</code> | Agent's credential username |
| request.secret | <code>string</code> | Agent's credential secret |
| request.privacy | <code>string</code> | If set to "Private" Fonoster removes identifiable information for the requests. Defaults to "None" |
| request.domains | <code>Array.&lt;string&gt;</code> | List of domains this Agent has access to |

**Example**  
```js
const request = {
  name: "John Doe",
  username: "john",
  secret: "1234",
  domains: ["sip.local"]
}

agents.createAgent(request)
.then(result => {
  console.log(result)            // returns the CreateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+getAgent"></a>

### agents.getAgent(ref) ⇒ <code>Promise.&lt;GetAgentResponse&gt;</code>
Retrives an Agent by reference.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;GetAgentResponse&gt;</code> - The agent  
**Throws**:

- if ref is null or Agent does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Agent |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

agents.getAgent(ref)
.then(result => {
  console.log(result)             // returns the GetAgentResponse interface
}).catch(e => console.error(e))   // an error occurred
```
<a name="Agents+updateAgent"></a>

### agents.updateAgent(request) ⇒ <code>Promise.&lt;UpdateAgentResponse&gt;</code>
Update an Agent at the SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateAgentRequest</code> | Request update of an Agent |
| request.ref | <code>string</code> | Reference to the Agent |
| request.name | <code>string</code> | Friendly name for the SIP device |
| request.secret | <code>string</code> | Agent's credential secret |

**Example**  
```js
const request = {
  name: "John Dee",
  secret: "12345"
}

agents.updateAgent(request)
.then(result => {
  console.log(result)            // returns the UpdateAgentResponse interface
}).catch(e => console.error(e))  // an error occurred
```
<a name="Agents+listAgents"></a>

### agents.listAgents(request) ⇒ <code>Promise.&lt;ListAgentsResponse&gt;</code>
List registered Agents in Fonoster SIP Proxy subsystem.

**Kind**: instance method of [<code>Agents</code>](#Agents)  
**Returns**: <code>Promise.&lt;ListAgentsResponse&gt;</code> - Paginated List of Agents  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListAgentsRequest</code> | Optional parameter with size and token for the request |
| request.pageSize | <code>number</code> | Elements per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
}

agents.listAgents(request)
.then(() => {
  console.log(result)            // returns a ListAgentsResponse interface
}).catch(e => console.error(e))  // an error occurred
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
const ref = "507f1f77bcf86cd799439011"

agents.deleteAgent(ref)
.then(() => {
  console.log("done")            // returns a reference of the agent
}).catch(e => console.error(e))  // an error occurred
```
