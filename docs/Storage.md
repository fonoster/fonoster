<a name="Storage"></a>

## Storage ⇐ <code>AbstractService</code>
Use YAPS Storage, a capability of YAPS Object Storage subsystem,
to upload, download, and delete objects.

**Kind**: global class  
**Extends**: <code>AbstractService</code>  
**See**: module:core:AbstractService  

* [Storage](#Storage) ⇐ <code>AbstractService</code>
    * [new Storage()](#new_Storage_new)
    * [.uploadObject(request)](#Storage+uploadObject)
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>string</code>

<a name="new_Storage_new"></a>

### new Storage()
Constructs a new Storage object.

**Example**  
```js
const YAPS = require('@yaps/sdk')
const storage = new YAPS.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Storage+uploadObject"></a>

### storage.uploadObject(request)
Upload an object to YAPS Object Storage subsystem.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Throws**:

- if the path does not exist or if is a directory
- if the bucket does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.filename | <code>string</code> | Path to the object to be uploaded |
| request.bucket | <code>string</code> | Directory at the Storage system to save your file. |

**Example**  
```js
const request = {
   e164Number: '+17853178071',
   ingressApp: 'hello-monkeys'
}

storage.uploadObject(request)
.then(() => {
  console.log(result)            // returns and empty Object
}).catch(e => console.error(e))  // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>string</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>string</code> - locally accessible URL to the object  
**Throws**:

- if bucket or object does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> |  |
| request.name | <code>string</code> | The name of the object |
| request.bucket | <code>string</code> | Bucket where object is located save your file. |

**Example**  
```js
const request = {
   name: 'object-name',
   bucket: 'bucket-name'
}

storage.getObjectURL(request)
.then(result => {
  console.log(result)            // returns a locally accesible URL
}).catch(e => console.error(e))  // an error occurred
```
