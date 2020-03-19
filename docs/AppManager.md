<a name="exp_module_appmanager--AppManager"></a>

## AppManager ⇐ <code>AbstractService</code> ⏏
Use YAPS AppManager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. The AppManager requires of a
running YAPS platform.

**Kind**: Exported class  
**Extends**: <code>AbstractService</code>  
**See**: module:core:AbstractService  
* [AppManager](#exp_module_appmanager--AppManager) ⇐ <code>AbstractService</code> ⏏
    * [new AppManager()](#new_module_appmanager--AppManager_new)
    * _instance_
        * [.getApp(name)](#module_appmanager--AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.createApp(request)](#module_appmanager--AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * _inner_
        * [~App](#module_appmanager--AppManager..App) : <code>Object</code>

<a name="new_module_appmanager--AppManager_new"></a>

### new AppManager()
Constructs a new AppManager Object

**Example**  
```js
const YAPS = require('@yaps/sdk')
const appmanager = new YAPS.AppManager()

appmanager.listApps()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_appmanager--AppManager+getApp"></a>

### appManager.getApp(name) ⇒ <code>Promise.&lt;App&gt;</code>
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#exp_module_appmanager--AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - The application  
**Throws**:

- Will throw an error if the argument is null.


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
<a name="module_appmanager--AppManager+createApp"></a>

### appManager.createApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#exp_module_appmanager--AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just created.  
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
<a name="module_appmanager--AppManager..App"></a>

### AppManager~App : <code>Object</code>
Application object

**Kind**: inner typedef of [<code>AppManager</code>](#exp_module_appmanager--AppManager)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| status | <code>App.Status</code> | Current status of the application. |
| name | <code>string</code> | A name, globally unique, for the application. |
| description | <code>string</code> | A description for the application. |
| createTime | <code>number</code> | Time the application was created. |
| updateTime | <code>number</code> | Last time the application was updated. |
| labels | <code>map</code> | Metadata for this application. |

