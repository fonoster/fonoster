## Classes

<dl>
<dt><a href="#AppManager">AppManager</a> ⇐ <code>AbstractService</code></dt>
<dd><p>Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations.</p>
</dd>
<dt><a href="#Storage">Storage</a> ⇐ <code>AbstractService</code></dt>
<dd><p>Store recordings and more</p>
</dd>
</dl>

## Members

<dl>
<dt><a href="#client">client</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p>Service Options</p>
</dd>
<dt><a href="#App">App</a> : <code>Object</code></dt>
<dd><p>Application object</p>
</dd>
</dl>

<a name="AppManager"></a>

## AppManager ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations.

**Kind**: global class  
**Extends**: <code>AbstractService</code>  

* [AppManager](#AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_AppManager_new)
    * [.listApps()](#AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(ref)](#AppManager+getApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.createApp(request)](#AppManager+createApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.updateApp(request)](#AppManager+updateApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.deleteApp(ref)](#AppManager+deleteApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)

<a name="new_AppManager_new"></a>

### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | [<code>Options</code>](#Options) | Optional configurations for the service |

**Example**  
```js
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
 }).catch(e => console.error(e))  // an error occurred
```
<a name="AppManager+listApps"></a>

### appManager.listApps() ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
List all applications in your YAPS system.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: <code>Promise.&lt;Array.&lt;App&gt;&gt;</code> - - A collection of applications  
<a name="AppManager+getApp"></a>

### appManager.getApp(ref) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - apps - The application  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

<a name="AppManager+createApp"></a>

### appManager.createApp(request) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - - The application just created  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="AppManager+updateApp"></a>

### appManager.updateApp(request) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Updates a previously created application.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="AppManager+deleteApp"></a>

### appManager.deleteApp(ref) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  

| Param | Type |
| --- | --- |
| ref | <code>string</code> | 

<a name="Storage"></a>

## Storage ⇐ <code>AbstractService</code>
Store recordings and more

**Kind**: global class  
**Extends**: <code>AbstractService</code>  

* [Storage](#Storage) ⇐ <code>AbstractService</code>
    * [new Storage(options)](#new_Storage_new)
    * [.listApps(n)](#Storage+listApps) ⇒ <code>string</code>

<a name="new_Storage_new"></a>

### new Storage(options)
Test documentation 2


| Param |
| --- |
| options | 

<a name="Storage+listApps"></a>

### storage.listApps(n) ⇒ <code>string</code>
Lists user applications

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>string</code> - A good string  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>string</code> | A string param |

<a name="client"></a>

## client
**Kind**: global variable  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="Options"></a>

## Options : <code>Object</code>
Service Options

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | Endpoint for this service |
| accessKeyId | <code>string</code> | Access Key Id |
| accessKeySecret | <code>string</code> | Access Key Secret |

<a name="App"></a>

## App : <code>Object</code>
Application object

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | [<code>Status</code>](#App.Status) | Current status of the application |
| ref | <code>string</code> | Application reference |
| name | <code>string</code> | A name for the application |
| description | <code>string</code> | A description for the application |
| create_time | <code>number</code> | Time the application was created |
| update_time | <code>number</code> | Last time the application was updated |
| entry_point | <code>number</code> | Last time the application was updated |
| labels | <code>map</code> | Metadata for this application |

<a name="App.Status"></a>

### App.Status : <code>Object</code>
App.Status

**Kind**: static typedef of [<code>App</code>](#App)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | <code>string</code> | Status of the application |

