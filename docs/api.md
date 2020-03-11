## Modules

<dl>
<dt><a href="#module_@yaps/appmanager">@yaps/appmanager</a></dt>
<dd></dd>
<dt><a href="#module_@yaps/storage">@yaps/storage</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#typedefs">typedefs</a></dt>
<dd></dd>
</dl>

<a name="module_@yaps/appmanager"></a>

## @yaps/appmanager
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/appmanager](#module_@yaps/appmanager)
    * [~AppManager](#module_@yaps/appmanager.AppManager) ⇐ <code>AbstractService</code>
        * [new AppManager(options)](#new_module_@yaps/appmanager.AppManager_new)
        * [.listApps()](#module_@yaps/appmanager.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
        * [.getApp(ref)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.deleteApp(ref)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;{void}&gt;</code>
    * [~App](#module_@yaps/appmanager..App) : <code>Object</code>
    * [~Options](#module_@yaps/appmanager..Options) : <code>Object</code>

<a name="module_@yaps/appmanager.AppManager"></a>

### @yaps/appmanager~AppManager ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations..

**Kind**: inner class of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Extends**: <code>AbstractService</code>  

* [~AppManager](#module_@yaps/appmanager.AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_module_@yaps/appmanager.AppManager_new)
    * [.listApps()](#module_@yaps/appmanager.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(ref)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.deleteApp(ref)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;{void}&gt;</code>

<a name="new_module_@yaps/appmanager.AppManager_new"></a>

#### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Optional configurations for the service |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+listApps"></a>

#### appmanager.listApps() ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
List all applications in your YAPS system.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;Array.&lt;App&gt;&gt;</code> - apps - A collection of applications  
**Example**  
```js
appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+getApp"></a>

#### appmanager.getApp(ref) ⇒ <code>Promise.&lt;App&gt;</code>
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - app - The application  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

**Example**  
```js
appmanager.getApp(ref)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+createApp"></a>

#### appmanager.createApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just created  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for object update |

**Example**  
```js
appmanager.creteApp(request)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+updateApp"></a>

#### appmanager.updateApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Updates a previously created application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

**Example**  
```js
appmanager.updateApp(request)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+deleteApp"></a>

#### appmanager.deleteApp(ref) ⇒ <code>Promise.&lt;{void}&gt;</code>
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;{void}&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

**Example**  
```js
appmanager.deleteApp(ref)
.then(result => {
   console.log(result)            // returns an empty result
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager..App"></a>

### @yaps/appmanager~App : <code>Object</code>
Application object

**Kind**: inner typedef of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | [<code>Status</code>](#App.Status) | Current status of the application |
| ref | <code>string</code> | Application reference |
| name | <code>string</code> | A name for the application |
| description | <code>string</code> | A description for the application |
| createTime | <code>number</code> | Time the application was created |
| updateTime | <code>number</code> | Last time the application was updated |
| entryPoint | <code>number</code> | main script for the application (ie: main.js or index.js) |
| labels | <code>map</code> | Metadata for this application |

<a name="module_@yaps/appmanager..Options"></a>

### @yaps/appmanager~Options : <code>Object</code>
Service Options

**Kind**: inner typedef of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | Endpoint for this service |
| accessKeyId | <code>string</code> | Access Key Id |
| accessKeySecret | <code>string</code> | Access Key Secret |

<a name="module_@yaps/storage"></a>

## @yaps/storage
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/storage](#module_@yaps/storage)
    * [~Storage](#module_@yaps/storage.Storage) ⇐ <code>AbstractService</code>
        * [new Storage(options)](#new_module_@yaps/storage.Storage_new)
        * [.listApps(n)](#module_@yaps/storage.Storage+listApps) ⇒ <code>string</code>

<a name="module_@yaps/storage.Storage"></a>

### @yaps/storage~Storage ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations..

**Kind**: inner class of [<code>@yaps/storage</code>](#module_@yaps/storage)  
**Extends**: <code>AbstractService</code>  

* [~Storage](#module_@yaps/storage.Storage) ⇐ <code>AbstractService</code>
    * [new Storage(options)](#new_module_@yaps/storage.Storage_new)
    * [.listApps(n)](#module_@yaps/storage.Storage+listApps) ⇒ <code>string</code>

<a name="new_module_@yaps/storage.Storage_new"></a>

#### new Storage(options)
Test documentation 2


| Param |
| --- |
| options | 

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/storage.Storage+listApps"></a>

#### storage.listApps(n) ⇒ <code>string</code>
Lists user applications

**Kind**: instance method of [<code>Storage</code>](#module_@yaps/storage.Storage)  
**Returns**: <code>string</code> - A good string  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>string</code> | A string param |

<a name="typedefs"></a>

## typedefs
**Kind**: global variable  
**Since**: v1  
**Author**: Pedro Sanders  
