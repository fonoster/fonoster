## Classes

<dl>
<dt><a href="#AppManager">AppManager</a> ⇐ <code>AbstractService</code></dt>
<dd><p>Use YAPS AppMAnager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. The AppManager requires of a
running YAPS platform..</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#App">App</a> : <code>Object</code></dt>
<dd><p>Application object</p>
</dd>
<dt><a href="#Options">Options</a> : <code>Object</code></dt>
<dd><p>Use the Options object to overwrite the service default configuration.</p>
</dd>
</dl>

<a name="AppManager"></a>

## AppManager ⇐ <code>AbstractService</code>
Use YAPS AppMAnager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. The AppManager requires of a
running YAPS platform.

**Kind**: global class  
**Extends**: <code>AbstractService</code>  

* [AppManager](#AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_AppManager_new)
    * [.getApp(name)](#AppManager+getApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
    * [.createApp(request)](#AppManager+createApp) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)

<a name="new_AppManager_new"></a>

### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | [<code>Options</code>](#Options) | Overwrite for the service's defaults configuration. |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="AppManager+getApp"></a>

### appmanager.getApp(name) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - app - The application  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The app identifier |

**Example**  
```js
appmanager.getApp(name)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="AppManager+createApp"></a>

### appmanager.createApp(request) ⇒ [<code>Promise.&lt;App&gt;</code>](#App)
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#AppManager)  
**Returns**: [<code>Promise.&lt;App&gt;</code>](#App) - - The application just created.  
**Todo**

- [ ] if the file uploading fails the state of the application should
change to UNKNOWN


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for object creation. |

**Example**  
```js
const request = {
   dirPath: '/path/to/project',
   app: {
       name: 'hello-world',
       description: 'Simple Voice App'
   }
}

appmanager.createApp(request)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="App"></a>

## App : <code>Object</code>
Application object

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | <code>App.Status</code> | Current status of the application. |
| name | <code>string</code> | A name, globally unique, for the application. |
| description | <code>string</code> | A description for the application. |
| createTime | <code>number</code> | Time the application was created. |
| updateTime | <code>number</code> | Last time the application was updated. |
| labels | <code>map</code> | Metadata for this application. |

<a name="Options"></a>

## Options : <code>Object</code>
Use the Options object to overwrite the service default configuration.

**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | The endpoint URI to send requests to. The endpoint should be a string like '{serviceHost}:{servicePort}'. |
| accessKeyId | <code>string</code> | your YAPS access key ID. |
| accessKeySecret | <code>string</code> | your YAPS secret access key. |
| bucket | <code>string</code> | The bucket to upload apps and media files. |
