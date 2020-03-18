## Modules

<dl>
<dt><a href="#module_@yaps/appmanager">@yaps/appmanager</a></dt>
<dd></dd>
<dt><a href="#module_@yaps/numbers">@yaps/numbers</a></dt>
<dd></dd>
<dt><a href="#module_@yaps/storage">@yaps/storage</a></dt>
<dd></dd>
</dl>

## Classes

<dl>
<dt><a href="#AbstractTTS">AbstractTTS</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#MaryTTS">MaryTTS</a></dt>
<dd></dd>
<dt><a href="#YapsWrapperChannel">YapsWrapperChannel</a></dt>
<dd></dd>
</dl>

## Constants

<dl>
<dt><a href="#AppManager">AppManager</a></dt>
<dd></dd>
<dt><a href="#fs">fs</a></dt>
<dd></dd>
<dt><a href="#AbstractTTS">AbstractTTS</a></dt>
<dd></dd>
<dt><a href="#flat">flat</a></dt>
<dd></dd>
<dt><a href="#path">path</a></dt>
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
        * [.getApp(name)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
        * [.deleteApp(name)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;void&gt;</code>
    * [~App](#module_@yaps/appmanager..App) : <code>Object</code>
    * [~Options](#module_@yaps/appmanager..Options) : <code>Object</code>

<a name="module_@yaps/appmanager.AppManager"></a>

### @yaps/appmanager~AppManager ⇐ <code>AbstractService</code>
Use YAPS AppMAnager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. The AppManager requires of a
running YAPS plattform.

**Kind**: inner class of [<code>@yaps/appmanager</code>](#module_@yaps/appmanager)  
**Extends**: <code>AbstractService</code>  

* [~AppManager](#module_@yaps/appmanager.AppManager) ⇐ <code>AbstractService</code>
    * [new AppManager(options)](#new_module_@yaps/appmanager.AppManager_new)
    * [.listApps(request)](#module_@yaps/appmanager.AppManager+listApps) ⇒ <code>Promise.&lt;Array.&lt;App&gt;&gt;</code>
    * [.getApp(name)](#module_@yaps/appmanager.AppManager+getApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.createApp(request)](#module_@yaps/appmanager.AppManager+createApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.updateApp(request)](#module_@yaps/appmanager.AppManager+updateApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [.deleteApp(name)](#module_@yaps/appmanager.AppManager+deleteApp) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_module_@yaps/appmanager.AppManager_new"></a>

#### new AppManager(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Overwrite for the service's defaults configuration. |

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

#### appmanager.getApp(name) ⇒ <code>Promise.&lt;App&gt;</code>
Retrives a single application by its reference.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - app - The application  

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
<a name="module_@yaps/appmanager.AppManager+createApp"></a>

#### appmanager.createApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
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
<a name="module_@yaps/appmanager.AppManager+updateApp"></a>

#### appmanager.updateApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Updates a previously created application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The application just updated.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for object update. |

**Example**  
```js
appmanager.updateApp(request)
.then(result => {
   console.log(result)            // returns the application object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/appmanager.AppManager+deleteApp"></a>

#### appmanager.deleteApp(name) ⇒ <code>Promise.&lt;void&gt;</code>
Delete an application.

**Kind**: instance method of [<code>AppManager</code>](#module_@yaps/appmanager.AppManager)  
**Returns**: <code>Promise.&lt;void&gt;</code> - - The application just updated  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | Unique reference to the application |

**Example**  
```js
appmanager.deleteApp(name)
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
| status | [<code>Status</code>](#App.Status) | Current status of the application. |
| name | <code>string</code> | A name, globally unique, for the application. |
| description | <code>string</code> | A description for the application. |
| createTime | <code>number</code> | Time the application was created. |
| updateTime | <code>number</code> | Last time the application was updated. |
| labels | <code>map</code> | Metadata for this application. |

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
| bucket | <code>string</code> | The bucket to upload apps and media files. |

<a name="module_@yaps/numbers"></a>

## @yaps/numbers
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/numbers](#module_@yaps/numbers)
    * [~Numbers](#module_@yaps/numbers.Numbers) ⇐ <code>AbstractService</code>
        * [new Numbers(options)](#new_module_@yaps/numbers.Numbers_new)
        * [.createNumber(request)](#module_@yaps/numbers.Numbers+createNumber) ⇒ <code>Promise.&lt;Number&gt;</code>
        * [.getIngressApp(request)](#module_@yaps/numbers.Numbers+getIngressApp) ⇒ <code>Promise.&lt;App&gt;</code>
    * [~Number](#module_@yaps/numbers..Number) : <code>Object</code>
    * [~Options](#module_@yaps/numbers..Options) : <code>Object</code>

<a name="module_@yaps/numbers.Numbers"></a>

### @yaps/numbers~Numbers ⇐ <code>AbstractService</code>
Use YAPS Numbers, a capability of YAPS Systems Numbers,
to create, and manage numbers. The Numbers service requires of a running
YAPS plattform.

**Kind**: inner class of [<code>@yaps/numbers</code>](#module_@yaps/numbers)  
**Extends**: <code>AbstractService</code>  

* [~Numbers](#module_@yaps/numbers.Numbers) ⇐ <code>AbstractService</code>
    * [new Numbers(options)](#new_module_@yaps/numbers.Numbers_new)
    * [.createNumber(request)](#module_@yaps/numbers.Numbers+createNumber) ⇒ <code>Promise.&lt;Number&gt;</code>
    * [.getIngressApp(request)](#module_@yaps/numbers.Numbers+getIngressApp) ⇒ <code>Promise.&lt;App&gt;</code>

<a name="new_module_@yaps/numbers.Numbers_new"></a>

#### new Numbers(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Overwrite for the service's defaults configuration. |

**Example**  
```Basic example```

const YAPS = require('@yaps/sdk')
const numbers = new YAPS.Numbers()

numbers.listNumbers()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
<a name="module_@yaps/numbers.Numbers+createNumber"></a>

#### numbers.createNumber(request) ⇒ <code>Promise.&lt;Number&gt;</code>
Creates a new application.

**Kind**: instance method of [<code>Numbers</code>](#module_@yaps/numbers.Numbers)  
**Returns**: <code>Promise.&lt;Number&gt;</code> - - The number just created.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for object creation. |

**Example**  
```js
const request = {
   e164Number: '+17853178070',
   ingressApp: 'hello-world'      // optional
}

numbers.createNumber(request)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/numbers.Numbers+getIngressApp"></a>

#### numbers.getIngressApp(request) ⇒ <code>Promise.&lt;App&gt;</code>
Gets application linked to a Number.

**Kind**: instance method of [<code>Numbers</code>](#module_@yaps/numbers.Numbers)  
**Returns**: <code>Promise.&lt;App&gt;</code> - - The app link to this number  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request for app link to number |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const numbers = new YAPS.Numbers()

const request = {
   e164Number: '+17853178070'
}

numbers.getIngressApp(request)
.then(result => {
   console.log(result)            // returns the app object
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/numbers..Number"></a>

### @yaps/numbers~Number : <code>Object</code>
Numbers object

**Kind**: inner typedef of [<code>@yaps/numbers</code>](#module_@yaps/numbers)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| e164Number | <code>string</code> | A e164 valid number |
| createTime | <code>number</code> | Time the application was created. |
| updateTime | <code>number</code> | Last time the application was updated. |

<a name="module_@yaps/numbers..Options"></a>

### @yaps/numbers~Options : <code>Object</code>
Use the Options object to overwrite the service default configuration.

**Kind**: inner typedef of [<code>@yaps/numbers</code>](#module_@yaps/numbers)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | The endpoint URI to send requests to. The endpoint should be a string like '{serviceHost}:{servicePort}'. |
| accessKeyId | <code>string</code> | your YAPS access key ID. |
| accessKeySecret | <code>string</code> | your YAPS secret access key. |
| bucket | <code>string</code> | The bucket to upload apps and media files. |

<a name="module_@yaps/storage"></a>

## @yaps/storage
**Since**: v1  
**Author**: Pedro Sanders  

* [@yaps/storage](#module_@yaps/storage)
    * [~Storage](#module_@yaps/storage.Storage) ⇐ <code>AbstractService</code>
        * [new Storage(options)](#new_module_@yaps/storage.Storage_new)
        * [.uploadObject(request)](#module_@yaps/storage.Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
        * [.getObjectURL(request)](#module_@yaps/storage.Storage+getObjectURL) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
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
    * [.getObjectURL(request)](#module_@yaps/storage.Storage+getObjectURL) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>

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
Uploads object to a YAPS bucket.

**Kind**: instance method of [<code>Storage</code>](#module_@yaps/storage.Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - - The response.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Object upload request. |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const storage = new YAPS.Storage()

const request = {
   filename: 'path/to/your/file',
   bucket: 'bucket-name',
   metadata: { 'Content-Type': 'audio/x-wav' }
}

storage.uploadObject(request)
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="module_@yaps/storage.Storage+getObjectURL"></a>

#### storage.getObjectURL(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Get the URL for a given object and bucket.

**Kind**: instance method of [<code>Storage</code>](#module_@yaps/storage.Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - - The response.  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Request to retrive object. |

**Example**  
```js
const YAPS = require('@yaps/sdk')
const storage = new YAPS.Storage()

const request = {
   name: 'object-name',
   bucket: 'bucket-name'
}

storage.getObjectURL(request)
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
| size | <code>number</code> | Size of uploaded file in bytes. |

<a name="AbstractTTS"></a>

## AbstractTTS
**Kind**: global class  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="MaryTTS"></a>

## MaryTTS
**Kind**: global variable  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="MaryTTS+synthesize"></a>

### maryTTS.synthesize()
Use options to change the voice and other basic parameters.

options {
   voice: peter
   locale: language
}

**Kind**: instance method of [<code>MaryTTS</code>](#MaryTTS)  
<a name="YapsWrapperChannel"></a>

## YapsWrapperChannel
**Kind**: global variable  
**Since**: v1  
**Author**: Pedro Sanders  

* [YapsWrapperChannel](#YapsWrapperChannel)
    * [.play()](#YapsWrapperChannel+play)
    * [.say()](#YapsWrapperChannel+say)
    * [.wait()](#YapsWrapperChannel+wait)
    * [.gather()](#YapsWrapperChannel+gather)
    * [.record()](#YapsWrapperChannel+record)

<a name="YapsWrapperChannel+play"></a>

### yapsWrapperChannel.play()
Param file - Is a file that has been previously uploaded or is available by default.
Param options - Optional parameters to alter the command's normal behavior.

Example options {
    finishOnKey: #,     // Default
}

Returns - Sent DTMF or undefined if no key was pressed before audio ends

**Kind**: instance method of [<code>YapsWrapperChannel</code>](#YapsWrapperChannel)  
<a name="YapsWrapperChannel+say"></a>

### yapsWrapperChannel.say()
Param text - Will be convert into a file and put in a cache for future use.
This method behavior is similar than play.
Example options {
    finishOnKey: #,     // Default
}

Returns - Sent DTMF or undefined if no key was pressed before audio ends

**Kind**: instance method of [<code>YapsWrapperChannel</code>](#YapsWrapperChannel)  
<a name="YapsWrapperChannel+wait"></a>

### yapsWrapperChannel.wait()
Param time - Time to wait in seconds. Defaults to 1s.

**Kind**: instance method of [<code>YapsWrapperChannel</code>](#YapsWrapperChannel)  
<a name="YapsWrapperChannel+gather"></a>

### yapsWrapperChannel.gather()
The Gather verb is used in combination with Play, Say, Wait. The are pipeline together
to create this powerful verb.

Example options {
    timeout: 4,         // Time in between key pressed. Defaults to 4 seconds.
                         // A time of zero will wait for ever for the finishOnKey.
    finishOnKey: #,     // Default
    maxDigits: 4        // Wait for the user to press digit.
}

Note: Either maxDigits or timeout must be greater than zero.

Returns - Sent digits or undefined if no key was pressed before timeout

**Kind**: instance method of [<code>YapsWrapperChannel</code>](#YapsWrapperChannel)  
<a name="YapsWrapperChannel+record"></a>

### yapsWrapperChannel.record()
Record creates a file with the sound send by receiving device
Example options {
    timeout: 4,         // Default
    finishOnKey: #,     // Characters used to finish the recording
    beep: true,
    offset: 0,
    maxDuration: 3600   // Maximum duration in seconds
}

Returns - Metadata with information about the recordings

TODO: Add constrains for the file's format

**Kind**: instance method of [<code>YapsWrapperChannel</code>](#YapsWrapperChannel)  
<a name="AppManager"></a>

## AppManager
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="fs"></a>

## fs
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="AbstractTTS"></a>

## AbstractTTS
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="flat"></a>

## flat
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
<a name="path"></a>

## path
**Kind**: global constant  
**Since**: v1  
**Author**: Pedro Sanders  
