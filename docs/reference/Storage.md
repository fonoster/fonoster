<a name="Storage"></a>

## Storage ⇐ <code>APIClient</code>
Use Fonoster Storage, a capability of Fonoster Object Storage subsystem,
to upload, download, and delete objects.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Storage](#Storage) ⇐ <code>APIClient</code>
    * [new Storage(options)](#new_Storage_new)
    * [new Storage(options)](#new_Storage_new)
    * [new Storage(options)](#new_Storage_new)
    * [new Storage(options)](#new_Storage_new)
    * [new Storage(options)](#new_Storage_new)
    * [.uploadObject(request)](#Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
    * [.uploadObject(request)](#Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
    * [.uploadObject(request)](#Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
    * [.uploadObject(request)](#Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
    * [.uploadObject(request)](#Storage+uploadObject) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>

<a name="new_Storage_new"></a>

### new Storage(options)
Constructs a new Storage object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const storage = new Fonoster.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Storage_new"></a>

### new Storage(options)
Constructs a new Storage object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const storage = new Fonoster.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Storage_new"></a>

### new Storage(options)
Constructs a new Storage object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const storage = new Fonoster.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Storage_new"></a>

### new Storage(options)
Constructs a new Storage object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const storage = new Fonoster.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Storage_new"></a>

### new Storage(options)
Constructs a new Storage object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const storage = new Fonoster.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Upload an object toFonosterObject Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if the path does not exist or if is a directory
- if the directory does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>UploadObjectRequest</code> | Object with information about the origin and destination of an object |
| request.bucket | <code>string</code> | Bucket at the Storage system |
| request.dir | <code>string</code> | Directory on the Storage system where your objec will be uploaded |
| request.filename | <code>string</code> | Path to the object to be uploaded |

**Example**  
```js
const request = {
   filename: "/path/to/file",
   bucket: "apps",
   directory: "/"
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;getObjectURLResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if directory or object doesn't exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetObjectURLRequest</code> | Object with information about the location and and name of the requested object |
| request.filename | <code>string</code> | The name of the object save your file. |
| request.accessKeyId | <code>string</code> | Optional access key id |

**Example**  
```js
const request = {
   filename: "object-name",
   bucket: "bucket-name"
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Upload an object toFonosterObject Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if the path does not exist or if is a directory
- if the directory does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>UploadObjectRequest</code> | Object with information about the origin and destination of an object |
| request.bucket | <code>string</code> | Bucket at the Storage system |
| request.dir | <code>string</code> | Directory on the Storage system where your objec will be uploaded |
| request.filename | <code>string</code> | Path to the object to be uploaded |

**Example**  
```js
const request = {
   filename: "/path/to/file",
   bucket: "apps",
   directory: "/"
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;getObjectURLResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if directory or object doesn't exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetObjectURLRequest</code> | Object with information about the location and and name of the requested object |
| request.filename | <code>string</code> | The name of the object save your file. |
| request.accessKeyId | <code>string</code> | Optional access key id |

**Example**  
```js
const request = {
   filename: "object-name",
   bucket: "bucket-name"
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Upload an object toFonosterObject Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if the path does not exist or if is a directory
- if the directory does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>UploadObjectRequest</code> | Object with information about the origin and destination of an object |
| request.bucket | <code>string</code> | Bucket at the Storage system |
| request.dir | <code>string</code> | Directory on the Storage system where your objec will be uploaded |
| request.filename | <code>string</code> | Path to the object to be uploaded |

**Example**  
```js
const request = {
   filename: "/path/to/file",
   bucket: "apps",
   directory: "/"
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;getObjectURLResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if directory or object doesn't exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetObjectURLRequest</code> | Object with information about the location and and name of the requested object |
| request.filename | <code>string</code> | The name of the object save your file. |
| request.accessKeyId | <code>string</code> | Optional access key id |

**Example**  
```js
const request = {
   filename: "object-name",
   bucket: "bucket-name"
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Upload an object toFonosterObject Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if the path does not exist or if is a directory
- if the directory does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>UploadObjectRequest</code> | Object with information about the origin and destination of an object |
| request.bucket | <code>string</code> | Bucket at the Storage system |
| request.dir | <code>string</code> | Directory on the Storage system where your objec will be uploaded |
| request.filename | <code>string</code> | Path to the object to be uploaded |

**Example**  
```js
const request = {
   filename: "/path/to/file",
   bucket: "apps",
   directory: "/"
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;getObjectURLResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if directory or object doesn't exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetObjectURLRequest</code> | Object with information about the location and and name of the requested object |
| request.filename | <code>string</code> | The name of the object save your file. |
| request.accessKeyId | <code>string</code> | Optional access key id |

**Example**  
```js
const request = {
   filename: "object-name",
   bucket: "bucket-name"
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request) ⇒ <code>Promise.&lt;UploadObjectResponse&gt;</code>
Upload an object toFonosterObject Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;UploadObjectResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if the path does not exist or if is a directory
- if the directory does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>UploadObjectRequest</code> | Object with information about the origin and destination of an object |
| request.bucket | <code>string</code> | Bucket at the Storage system |
| request.dir | <code>string</code> | Directory on the Storage system where your objec will be uploaded |
| request.filename | <code>string</code> | Path to the object to be uploaded |

**Example**  
```js
const request = {
   filename: "/path/to/file",
   bucket: "apps",
   directory: "/"
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;getObjectURLResponse&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;getObjectURLResponse&gt;</code> - localy accessible URL to the object  
**Throws**:

- if directory or object doesn't exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>GetObjectURLRequest</code> | Object with information about the location and and name of the requested object |
| request.filename | <code>string</code> | The name of the object save your file. |
| request.accessKeyId | <code>string</code> | Optional access key id |

**Example**  
```js
const request = {
   filename: "object-name",
   bucket: "bucket-name"
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
