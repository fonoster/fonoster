## Modules

<dl>
<dt><a href="#module_@yaps/appmanager">@yaps/appmanager</a></dt>
<dd></dd>
<dt><a href="#module_@yaps/storage">@yaps/storage</a></dt>
<dd></dd>
</dl>

<a name="module_@yaps/appmanager"></a>

## @yaps/appmanager
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/appmanager](#module_@yaps/appmanager)
    * [~AppManager](#module_@yaps/appmanager.AppManager) ⇐ <code>AbstractService</code>
        * [new AppManager(options)](#new_module_@yaps/appmanager.AppManager_new)
        * [.listApps(request)](#module_@yaps/appmanager.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
        * [.getApp(ref)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.deleteApp(ref)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;void&gt;</code>
    * [~App](#module_@yaps/appmanager..App) : <code>Object</code>
    * [~Options](#module_@yaps/appmanager..Options) : <code>Object</code>

<a name="module_@yaps/appmanager.AppManager"></a>

### @yaps/appmanager~AppManager ⇐ <code>AbstractService</code>
Use YAPS AppMAnager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. AppManager supports controlled
The AppManager requires of a running YAPS plattform.

**Kind**: inner class of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Extends**: <code>AbstractService</code>  

* [~AppManager](#module_@yaps/appmanager.AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_module_@yaps/appmanager.AppManager_new)
    * [.listApps(request)](#module_@yaps/appmanager.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(ref)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.deleteApp(ref)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_module_@yaps/appmanager.AppManager_new"></a>

#### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Overwrite for the service's defaults configuration |

**Example**  
```Basic example```

const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
<a name="module_@yaps/appmanager.AppManager+listApps"></a>

#### appmanager.listApps(request) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
List all applications in your YAPS system.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;Array.&lt;App&gt;&gt;</code> - apps - A collection of applications  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Optional request |

**Example**  
```js
const request = { pageSize: 1, pageToken: 2, view: 'FULL'}

appmanager.listApps(request)
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
const request = {
   filePath: '/file/to/zipped/project',
   app: {
       name: 'hello-world',
       description: 'Simple Voice App'
   }
}

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
   console.log(result)            // returns the application object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+deleteApp"></a>

#### appmanager.deleteApp(ref) ⇒ <code>Promise.&lt;void&gt;</code>
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Unique reference to the application |

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
| ref | <code>string</code> | Unique identifier for the application |
| name | <code>string</code> | A name for the application |
| description | <code>string</code> | A description for the application |
| createTime | <code>number</code> | Time the application was created |
| updateTime | <code>number</code> | Last time the application was updated |
| entryPoint | <code>number</code> | main script for the application (ie: main.js or index.js). this is use by the Media Controller to properly route a call. |
| labels | <code>map</code> | Metadata for this application |

<a name="module_@yaps/appmanager..Options"></a>

### @yaps/appmanager~Options : <code>Object</code>
Use the Options object to overwrite the service default configuration.

**Kind**: inner typedef of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | The endpoint URI to send requests to. The endpoint should be a string like '{serviceHost}:{servicePort}'. |
| accessKeyId | <code>string</code> | your YAPS access key ID. |
| accessKeySecret | <code>string</code> | your YAPS secret access key. |

<a name="module_@yaps/storage"></a>

## @yaps/storage
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/storage](#module_@yaps/storage)
    * [~Storage](#module_@yaps/storage.Storage) ⇐ <code>AbstractService</code>
        * [new Storage(options)](#new_module_@yaps/storage.Storage_new)
        * [.uploadObject(request)](#module_@yaps/storage.Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [~UploadObjectResponse](#module_@yaps/storage..UploadObjectResponse) : <code>Object</code>

<a name="module_@yaps/storage.Storage"></a>

### @yaps/storage~Storage ⇐ <code>AbstractService</code>
Use YAPS Storage, a capability of YAPS Systems Storage,
to create, manage, and deploy an buckets and to upload and download files
to your buckets.

**Kind**: inner class of [<code>@yaps/storage</code>](#module_@yaps/storage)  
**Extends**: <code>AbstractService</code>  

* [~Storage](#module_@yaps/storage.Storage) ⇐ <code>AbstractService</code>
    * [new Storage(options)](#new_module_@yaps/storage.Storage_new)
    * [.uploadObject(request)](#module_@yaps/storage.Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>

<a name="new_module_@yaps/storage.Storage_new"></a>

#### new Storage(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Overwrite for the service's defaults configuration |

**Example**  
```Basic example```

const YAPS = require('@yaps/sdk')
const storage = new YAPS.Storage()

const request = {
   filename: 'path/to/your/file',
   bucket: 'bucket-name'
}

storage.uploadObject(request)
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
<a name="module_@yaps/storage.Storage+uploadObject"></a>

#### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>Storage</code>](#module_@yaps/storage.Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - - The application just created  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Object upload request |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const storage = new YAPS.Storage()

const request = {
   filename: 'path/to/your/file',
   bucket: 'bucket-name'
}

storage.uploadObject(request)
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/storage..UploadObjectResponse"></a>

### @yaps/storage~UploadObjectResponse : <code>Object</code>
Upload Object Response

**Kind**: inner typedef of [<code>@yaps/storage</code>](#module_@yaps/storage)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| size | <code>number</code> | Uploaded file size in bytes. |

