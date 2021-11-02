<a name="Funcs"></a>

## Funcs ⇐ <code>APIClient</code>
Use Fonoster Funcs, a capability of FaaS subsystem,
to deploy, update, get and delete functions. Fonoster Funcs requires of a
running Fonoster deployment and FaaS.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Funcs](#Funcs) ⇐ <code>APIClient</code>
    * [new Funcs(options)](#new_Funcs_new)
    * [new Funcs(options)](#new_Funcs_new)
    * [new Funcs(options)](#new_Funcs_new)
    * [.deployFunc(request)](#Funcs+deployFunc) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
    * [.getFunc(request)](#Funcs+getFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.deleteFunc(request)](#Funcs+deleteFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.listFuncs(request)](#Funcs+listFuncs) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
    * [.getFuncLogs(request)](#Funcs+getFuncLogs) ⇒ <code>Promise.&lt;LogsStream&gt;</code>
    * [.deployFunc(request)](#Funcs+deployFunc) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
    * [.getFunc(request)](#Funcs+getFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.deleteFunc(request)](#Funcs+deleteFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.listFuncs(request)](#Funcs+listFuncs) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
    * [.getFuncLogs(request)](#Funcs+getFuncLogs) ⇒ <code>Promise.&lt;LogsStream&gt;</code>
    * [.deployFunc(request)](#Funcs+deployFunc) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
    * [.getFunc(request)](#Funcs+getFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.deleteFunc(request)](#Funcs+deleteFunc) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
    * [.listFuncs(request)](#Funcs+listFuncs) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
    * [.getFuncLogs(request)](#Funcs+getFuncLogs) ⇒ <code>Promise.&lt;LogsStream&gt;</code>

<a name="new_Funcs_new"></a>

### new Funcs(options)
Constructs a new Funcs object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  name: "function1",
  path: "/path/to/function",
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Funcs_new"></a>

### new Funcs(options)
Constructs a new Funcs object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  name: "function1",
  path: "/path/to/function",
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="new_Funcs_new"></a>

### new Funcs(options)
Constructs a new Funcs object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const request = {
  name: "function1",
  path: "/path/to/function",
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deployFunc"></a>

### funcs.deployFunc(request) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeployFuncRequest</code> | Request to create or update a function |
| request.path | <code>string</code> | Path to the function. |
| request.name | <code>string</code> | Unique function name |
| request.schedule | <code>string</code> | Unique function name |
| request.limit.memory | <code>string</code> | Optional limit for function's memory utilization |
| request.limit.cpu | <code>string</code> | Optional limit for function's cpu utilization |
| request.requests.memory | <code>string</code> | Optional requested memory allocation for the function |
| request.requests.cpu | <code>string</code> | Optional requested cpu allocation for the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  schedule: "* * * * *",  // Intervals using standard cron syntax
  path: "/path/to/function",
  limits: {
     cpu: 100m,
     memory: 40Mi
  },
  requests: {
     cpu: 100m,
     memory: 40Mi
  }
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+getFunc"></a>

### funcs.getFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Gets a system function by name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncRequest</code> | Request to get a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.getFunc(request)
.then(result => {
  console.log(result)              // successful response with the function as the body65
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deleteFunc"></a>

### funcs.deleteFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Removes a function by its name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Note**: This action will remove all function statistics.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeleteFuncRequest</code> | Request to delete a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.deleteFunc(request)
.then(result => {
  console.log(result)              // returns the name of the function
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+listFuncs"></a>

### funcs.listFuncs(request) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
Returns a list of functions owned by the User.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Returns**: <code>Promise.&lt;ListFuncsResponse&gt;</code> - List of Functions  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListFuncsRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

funcs.listFuncs(request)
.then(() => {
  console.log(result)             // returns a ListFuncsResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Funcs+getFuncLogs"></a>

### funcs.getFuncLogs(request) ⇒ <code>Promise.&lt;LogsStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncLogsRequest</code> | Request to obtain the logs for a function |
| request.name | <code>string</code> | Function name |
| request.since | <code>string</code> | Only return logs after a specific date (RFC3339) |
| request.tail | <code>string</code> | Sets the maximum number of log messages to return, <=0 means unlimited |
| request.follow | <code>string</code> | When true, the request will stream logs until the request timeout |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  tail: 10,
  follow: true,
  since: "2021-05-12T07:20:50.52Z"
};

funcs.getFuncLogs(request)
.then(stream => {
  stream.onMessage(log => console.log(log))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deployFunc"></a>

### funcs.deployFunc(request) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeployFuncRequest</code> | Request to create or update a function |
| request.path | <code>string</code> | Path to the function. |
| request.name | <code>string</code> | Unique function name |
| request.schedule | <code>string</code> | Unique function name |
| request.limit.memory | <code>string</code> | Optional limit for function's memory utilization |
| request.limit.cpu | <code>string</code> | Optional limit for function's cpu utilization |
| request.requests.memory | <code>string</code> | Optional requested memory allocation for the function |
| request.requests.cpu | <code>string</code> | Optional requested cpu allocation for the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  schedule: "* * * * *",  // Intervals using standard cron syntax
  path: "/path/to/function",
  limits: {
     cpu: 100m,
     memory: 40Mi
  },
  requests: {
     cpu: 100m,
     memory: 40Mi
  }
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+getFunc"></a>

### funcs.getFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Gets a system function by name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncRequest</code> | Request to get a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.getFunc(request)
.then(result => {
  console.log(result)              // successful response with the function as the body65
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deleteFunc"></a>

### funcs.deleteFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Removes a function by its name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Note**: This action will remove all function statistics.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeleteFuncRequest</code> | Request to delete a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.deleteFunc(request)
.then(result => {
  console.log(result)              // returns the name of the function
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+listFuncs"></a>

### funcs.listFuncs(request) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
Returns a list of functions owned by the User.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Returns**: <code>Promise.&lt;ListFuncsResponse&gt;</code> - List of Functions  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListFuncsRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

funcs.listFuncs(request)
.then(() => {
  console.log(result)             // returns a ListFuncsResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Funcs+getFuncLogs"></a>

### funcs.getFuncLogs(request) ⇒ <code>Promise.&lt;LogsStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncLogsRequest</code> | Request to obtain the logs for a function |
| request.name | <code>string</code> | Function name |
| request.since | <code>string</code> | Only return logs after a specific date (RFC3339) |
| request.tail | <code>string</code> | Sets the maximum number of log messages to return, <=0 means unlimited |
| request.follow | <code>string</code> | When true, the request will stream logs until the request timeout |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  tail: 10,
  follow: true,
  since: "2021-05-12T07:20:50.52Z"
};

funcs.getFuncLogs(request)
.then(stream => {
  stream.onMessage(log => console.log(log))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deployFunc"></a>

### funcs.deployFunc(request) ⇒ <code>Promise.&lt;DeployStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeployFuncRequest</code> | Request to create or update a function |
| request.path | <code>string</code> | Path to the function. |
| request.name | <code>string</code> | Unique function name |
| request.schedule | <code>string</code> | Unique function name |
| request.limit.memory | <code>string</code> | Optional limit for function's memory utilization |
| request.limit.cpu | <code>string</code> | Optional limit for function's cpu utilization |
| request.requests.memory | <code>string</code> | Optional requested memory allocation for the function |
| request.requests.cpu | <code>string</code> | Optional requested cpu allocation for the function |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  schedule: "* * * * *",  // Intervals using standard cron syntax
  path: "/path/to/function",
  limits: {
     cpu: 100m,
     memory: 40Mi
  },
  requests: {
     cpu: 100m,
     memory: 40Mi
  }
};

funcs.deployFunc(request)
.then(stream => {
  stream.onMessage(msg => console.log(msg))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+getFunc"></a>

### funcs.getFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Gets a system function by name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncRequest</code> | Request to get a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.getFunc(request)
.then(result => {
  console.log(result)              // successful response with the function as the body65
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+deleteFunc"></a>

### funcs.deleteFunc(request) ⇒ <code>Promise.&lt;GetFuncResponse&gt;</code>
Removes a function by its name.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Note**: This action will remove all function statistics.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>DeleteFuncRequest</code> | Request to delete a function |
| request.name | <code>string</code> | Unique function name |

**Example**  
```js
const request = {
  name: "function1"
};

funcs.deleteFunc(request)
.then(result => {
  console.log(result)              // returns the name of the function
}).catch(e => console.error(e));   // an error occurred
```
<a name="Funcs+listFuncs"></a>

### funcs.listFuncs(request) ⇒ <code>Promise.&lt;ListFuncsResponse&gt;</code>
Returns a list of functions owned by the User.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  
**Returns**: <code>Promise.&lt;ListFuncsResponse&gt;</code> - List of Functions  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListFuncsRequest</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {
   pageSize: 20,
   pageToken: 2
};

funcs.listFuncs(request)
.then(() => {
  console.log(result)             // returns a ListFuncsResponse object
}).catch(e => console.error(e));  // an error occurred
```
<a name="Funcs+getFuncLogs"></a>

### funcs.getFuncLogs(request) ⇒ <code>Promise.&lt;LogsStream&gt;</code>
Creates or updates a function in the FaaS subsystem.

**Kind**: instance method of [<code>Funcs</code>](#Funcs)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetFuncLogsRequest</code> | Request to obtain the logs for a function |
| request.name | <code>string</code> | Function name |
| request.since | <code>string</code> | Only return logs after a specific date (RFC3339) |
| request.tail | <code>string</code> | Sets the maximum number of log messages to return, <=0 means unlimited |
| request.follow | <code>string</code> | When true, the request will stream logs until the request timeout |

**Example**  
```js
const Fonoster = require("@fonoster/sdk");
const funcs = new Fonoster.Funcs();

const request = {
  name: "function1",
  tail: 10,
  follow: true,
  since: "2021-05-12T07:20:50.52Z"
};

funcs.getFuncLogs(request)
.then(stream => {
  stream.onMessage(log => console.log(log))
  stream.onFinish(() => console.log("end"))
  stream.onError(e => console.error(e))
}).catch(e => console.error(e));   // an error occurred
```
