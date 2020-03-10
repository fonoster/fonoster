## Objects

<dl>
<dt><a href="#YAPS">YAPS</a> : <code>object</code></dt>
<dd><p>A namespace.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#typedefs">typedefs</a></dt>
<dd></dd>
</dl>

## Typedefs

<dl>
<dt><a href="#App">App</a> : <code>Object</code></dt>
<dd><p>Application object</p>
</dd>
</dl>

<a name="YAPS"></a>

## YAPS : <code>object</code>
A namespace.

**Kind**: global namespace  

* [YAPS](#YAPS) : <code>object</code>
    * [~AppManager](#YAPS.AppManager) ⇐ <code>AbstractService</code>
        * [new AppManager(options)](#new_YAPS.AppManager_new)
        * [.listApps()](#YAPS.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
        * [.getApp(ref)](#YAPS.AppManager+getApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
        * [.createApp(request)](#YAPS.AppManager+createApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
        * [.updateApp(request)](#YAPS.AppManager+updateApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
        * [.deleteApp(ref)](#YAPS.AppManager+deleteApp)
    * [~Storage](#YAPS.Storage) ⇐ <code>AbstractService</code>
        * [new Storage(options)](#new_YAPS.Storage_new)
        * [.listApps(n)](#YAPS.Storage+listApps) ⇒ <code>string</code>

<a name="YAPS.AppManager"></a>

### YAPS~AppManager ⇐ <code>AbstractService</code>
Use YAPS AppManager, a capability of YAPS Systems Manager, to create,
manage, and quickly deploy application configurations.

**Kind**: inner class of [<code>YAPS</code>](#YAPS)  
**Extends**: <code>AbstractService</code>  

* [~AppManager](#YAPS.AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_YAPS.AppManager_new)
    * [.listApps()](#YAPS.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(ref)](#YAPS.AppManager+getApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.createApp(request)](#YAPS.AppManager+createApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.updateApp(request)](#YAPS.AppManager+updateApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.deleteApp(ref)](#YAPS.AppManager+deleteApp)

<a name="new_YAPS.AppManager_new"></a>

#### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>typedefs.Options</code> | Optional configurations for the service |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="YAPS.AppManager+listApps"></a>

#### appManager.listApps() ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
List all applications in your YAPS system.

**Kind**: instance method of [<code>AppManager</code>](#YAPS.AppManager)  
**Returns**: <code>Promise.&lt;Array.&lt;App&gt;&gt;</code> - apps - A collection of applications  
<a name="YAPS.AppManager+getApp"></a>

#### appManager.getApp(ref) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#YAPS.AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - app - The application  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

<a name="YAPS.AppManager+createApp"></a>

#### appManager.createApp(request) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#YAPS.AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - - The application just created  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="YAPS.AppManager+updateApp"></a>

#### appManager.updateApp(request) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Updates a previously created application.

**Kind**: instance method of [<code>AppManager</code>](#YAPS.AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>\*</code> | Request for object update |

<a name="YAPS.AppManager+deleteApp"></a>

#### appManager.deleteApp(ref)
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#YAPS.AppManager)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | The reference |

<a name="YAPS.Storage"></a>

### YAPS~Storage ⇐ <code>AbstractService</code>
Store recordings and more

**Kind**: inner class of [<code>YAPS</code>](#YAPS)  
**Extends**: <code>AbstractService</code>  

* [~Storage](#YAPS.Storage) ⇐ <code>AbstractService</code>
    * [new Storage(options)](#new_YAPS.Storage_new)
    * [.listApps(n)](#YAPS.Storage+listApps) ⇒ <code>string</code>

<a name="new_YAPS.Storage_new"></a>

#### new Storage(options)
Test documentation 2


| Param |
| --- |
| options | 

<a name="YAPS.Storage+listApps"></a>

#### storage.listApps(n) ⇒ <code>string</code>
Lists user applications

**Kind**: instance method of [<code>Storage</code>](#YAPS.Storage)  
**Returns**: <code>string</code> - A good string  

| Param | Type | Description |
| --- | --- | --- |
| n | <code>string</code> | A string param |

<a name="typedefs"></a>

## typedefs
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="App"></a>

## App : <code>Object</code>
Application object

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | <code>App.Status</code> | Current status of the application |
| ref | <code>string</code> | Application reference |
| name | <code>string</code> | A name for the application |
| description | <code>string</code> | A description for the application |
| create_time | <code>number</code> | Time the application was created |
| update_time | <code>number</code> | Last time the application was updated |
| entry_point | <code>number</code> | Last time the application was updated |
| labels | <code>map</code> | Metadata for this application |

