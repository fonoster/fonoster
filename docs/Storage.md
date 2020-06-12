<a name="Storage"></a>

## Storage ⇐ <code>FonosService</code>
Use Fonos Storage, a capability of Fonos Object Storage subsystem,
to upload, download, and delete objects.

**Kind**: global class  
**Extends**: <code>FonosService</code>  
**See**: module:core:FonosService  

* [Storage](#Storage) ⇐ <code>FonosService</code>
    * [new Storage()](#new_Storage_new)
    * [.getObjectURL(request)](#Storage+getObjectURL) ⇒ <code>Promise.&lt;string&gt;</code>

<a name="new_Storage_new"></a>

### new Storage()
Constructs a new Storage object.

**Example**  
```js
const Fonos = require('@fonos/sdk')
const storage = new Fonos.Storage()

storage.uploadObject()
.then(result => {
   console.log(result)            // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Storage+getObjectURL"></a>

### storage.getObjectURL(request) ⇒ <code>Promise.&lt;string&gt;</code>
Get Object URL.

**Kind**: instance method of [<code>Storage</code>](#Storage)  
**Returns**: <code>Promise.&lt;string&gt;</code> - localy accessible URL to the object  
**Throws**:

- if bucket or object does not exist


| Param | Type | Description |
| --- | --- | --- |
| request | <code>Object</code> | Object with information about the location and and name of the requested object |
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
  console.log(result)
}).catch(e => console.error(e))  // an error occurred
```
