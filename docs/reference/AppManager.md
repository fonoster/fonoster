<a name="AppManager"></a>

## AppManager ⇐ <code>FonosService</code>
Use Fonos AppManager, a capability of Fonos Systems Manager,to create, manage, and deploy an applications. Fonos AppManager requires of arunning Fonos deployment.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [AppManager](#AppManager) ⇐ <code>FonosService</code>
    * [new AppManager()](#new_AppManager_new)
    * [.deployApp(path)](#AppManager+deployApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.getApp(name)](#AppManager+getApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.deleteApp(name)](#AppManager+deleteApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.listApps(request)](#AppManager+listApps) ⇒ <code>Promise.&lt;ListAppsResponse&gt;</code>

<a name="new_AppManager_new"></a>

### new AppManager()
Constructs a new AppManager Object.

**Example**  
```js
const Fonos = require('@fonos/sdk')const appManager = new Fonos.AppManager()appManager.deployApp('/path/to/app').then(result => {  console.log(result)             // successful response}).catch(e => console.error(e))   // an error occurred
```
<a name="AppManager+deployApp"></a>

### appManager.deployApp(path) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Deploys an application to Fonos.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - The application just created  
**Throws**:

- if path to application does not exist or is not a directory
- the file package.json does not exist inside de application path
- the file package.json is missing the name or description

**Todo**

- [ ] if the file uploading fails the state of the application shouldchange to UNKNOWN.


| Param | Type | Description |
| --- | --- | --- |
| path | <code>string</code> | path to the application |

**Example**  
```js
const path = '/path/to/project'appManager.deployApp(path).then(result => {  console.log(result)            // returns the app object}).catch(e => console.error(e))   // an error occurred
```
<a name="AppManager+getApp"></a>

### appManager.getApp(name) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Retrives an application by name.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - The application  
**Throws**:

- if name is null or application does not exist


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the application |

**Example**  
```js
appManager.getApp(name).then(result => {  console.log(result)             // returns the app object}).catch(e => console.error(e))   // an error occurred
```
<a name="AppManager+deleteApp"></a>

### appManager.deleteApp(name) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Deletes an application already registered in Fonos.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - The application to remove  
**Throws**:

- if the application is not found


| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The name of the application |

**Example**  
```js
appManager.deleteApp(name).then(() => {  console.log('finished')        // returns an empty object}).catch(e => console.error(e))  // an error occurred
```
<a name="AppManager+listApps"></a>

### appManager.listApps(request) ⇒ <code>Promise.&lt;ListAppsResponse&gt;</code>
List the applications registered in Fonos.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: <code>Promise.&lt;ListAppsResponse&gt;</code> - List of applications  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.pageSize | <code>number</code> | Number of element per page (defaults to 20) |
| request.pageToken | <code>string</code> | The next_page_token value returned from a previous List request, if any |

**Example**  
```js
const request = {   pageSize: 20,   pageToken: 2}appManager.listApps(request).then(result => {  console.log(result)            // returns a ListAppsResponse}).catch(e => console.error(e))  // an error occurred
```
