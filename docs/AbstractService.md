<a name="exp_module_core--AbstractService"></a>

## AbstractService ⏏
Use YAPS AppManager, a capability of YAPS Systems Manager,
to create, manage, and deploy an application. The AppManager requires of a
running YAPS platform.

**Kind**: Exported class  
* [AbstractService](#exp_module_core--AbstractService) ⏏
    * [new AbstractService(options)](#new_module_core--AbstractService_new)
    * [~Options](#module_core--AbstractService..Options) : <code>Object</code>

<a name="new_module_core--AbstractService_new"></a>

### new AbstractService(options)
Constructs a service object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Options</code> | Overwrite for the service's defaults configuration. |

<a name="module_core--AbstractService..Options"></a>

### AbstractService~Options : <code>Object</code>
Use the Options object to overwrite the service default configuration.

**Kind**: inner typedef of [<code>AbstractService</code>](#exp_module_core--AbstractService)  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| endpoint | <code>string</code> | The endpoint URI to send requests to. The endpoint should be a string like '{serviceHost}:{servicePort}'. |
| accessKeyId | <code>string</code> | your YAPS access key ID. |
| accessKeySecret | <code>string</code> | your YAPS secret access key. |
| bucket | <code>string</code> | The bucket to upload apps and media files. |

