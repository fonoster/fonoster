## Modules

<dl>
<dt><a href="#module_YAPS">YAPS</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#typedefs">typedefs</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p>Service Options</p>
</dd>
</dl>

<a name="module_YAPS"></a>

## YAPS
**Since**: v1  
**Author**: Pedro Sanders  

* [YAPS](#module_YAPS)
    * [~AppManager](#module_YAPS.AppManager) ⇐ <code>AbstractService</code>
        * [new AppManager(options)](#new_module_YAPS.AppManager_new)
        * [.listApps()](#module_YAPS.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
        * [.getApp(ref)](#module_YAPS.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.createApp(request)](#module_YAPS.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.updateApp(request)](#module_YAPS.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.deleteApp(ref)](#module_YAPS.AppManager+deleteApp) ⇒ <code>Promise.&lt;{void}&gt;</code>
    * [~Storage](#module_YAPS.Storage) ⇐ <code>AbstractService</code>
        * [new Storage(options)](#new_module_YAPS.Storage_new)
        * [.listApps(n)](#module_YAPS.Storage+listApps) ⇒ <code>string</code>

<a name="module_YAPS.AppManager"></a>

### YAPS~AppManager ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations..

**Kind**: inner class of [<code>YAPS</code>](#module_YAPS)  
**Extends**: <code>AbstractService</code>  

* [~AppManager](#module_YAPS.AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_module_YAPS.AppManager_new)
    * [.listApps()](#module_YAPS.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(ref)](#module_YAPS.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.createApp(request)](#module_YAPS.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.updateApp(request)](#module_YAPS.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.deleteApp(ref)](#module_YAPS.AppManager+deleteApp) ⇒ <code>Promise.&lt;{void}&gt;</code>

<a name="new_module_YAPS.AppManager_new"></a>

#### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | [<code>Options</code>](#Options) | Optional configurations for the service |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_YAPS.AppManager+listApps"></a>

#### appmanager.listApps() ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
List all applications in your YAPS system.

**Kind**: instance method of [<code>AppManager</code>](#module_YAPS.AppManager)  
**Returns**: <code>Promise.&lt;Array.&lt;App&gt;&gt;</code> - apps - A collection of applications  
<a name="module_YAPS.AppManager+getApp"></a>

#### appmanager.getApp(ref) ⇒ <code>Promise.&lt;App&gt;</code>
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#module_YAPS.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - app - The application  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

<a name="module_YAPS.AppManager+createApp"></a>

#### appmanager.createApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#module_YAPS.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just created  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="module_YAPS.AppManager+updateApp"></a>

#### appmanager.updateApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Updates a previously created application.

**Kind**: instance method of [<code>AppManager</code>](#module_YAPS.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="module_YAPS.AppManager+deleteApp"></a>

#### appmanager.deleteApp(ref) ⇒ <code>Promise.&lt;{void}&gt;</code>
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#module_YAPS.AppManager)  
**Returns**: <code>Promise.&lt;{void}&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

<a name="module_YAPS.Storage"></a>

### YAPS~Storage ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations..

**Kind**: inner class of [<code>YAPS</code>](#module_YAPS)  
**Extends**: <code>AbstractService</code>  

* [~Storage](#module_YAPS.Storage) ⇐ <code>AbstractService</code>
    * [new Storage(options)](#new_module_YAPS.Storage_new)
    * [.listApps(n)](#module_YAPS.Storage+listApps) ⇒ <code>string</code>

<a name="new_module_YAPS.Storage_new"></a>

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
<a name="module_YAPS.Storage+listApps"></a>

#### storage.listApps(n) ⇒ <code>string</code>
Lists user applications

**Kind**: instance method of [<code>Storage</code>](#module_YAPS.Storage)  
**Returns**: <code>string</code> - A good string  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>string</code> | A string param |

<a name="typedefs"></a>

## typedefs
**Kind**: global constant  
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

