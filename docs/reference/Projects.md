<a name="Projects"></a>

## Projects ⇐ <code>APIClient</code>
Use Fonoster Projects, a capability of Fonoster,
to create, update, get and delete Projects. Projects requires of a
running Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Projects](#Projects) ⇐ <code>APIClient</code>
    * [new Projects(options)](#new_Projects_new)
    * [new Projects(options)](#new_Projects_new)
    * [new Projects(options)](#new_Projects_new)
    * [new Projects(options)](#new_Projects_new)
    * [.listProjects(request)](#Projects+listProjects) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
    * [.createProject(request)](#Projects+createProject) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
    * [.getProject(ref)](#Projects+getProject) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
    * [.updateProject(request)](#Projects+updateProject) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
    * [.deleteProject(ref)](#Projects+deleteProject)
    * [.renewAccessKeySecret(request)](#Projects+renewAccessKeySecret)
    * [.listProjects(request)](#Projects+listProjects) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
    * [.createProject(request)](#Projects+createProject) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
    * [.getProject(ref)](#Projects+getProject) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
    * [.updateProject(request)](#Projects+updateProject) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
    * [.deleteProject(ref)](#Projects+deleteProject)
    * [.renewAccessKeySecret(request)](#Projects+renewAccessKeySecret)
    * [.listProjects(request)](#Projects+listProjects) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
    * [.createProject(request)](#Projects+createProject) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
    * [.getProject(ref)](#Projects+getProject) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
    * [.updateProject(request)](#Projects+updateProject) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
    * [.deleteProject(ref)](#Projects+deleteProject)
    * [.renewAccessKeySecret(request)](#Projects+renewAccessKeySecret)
    * [.listProjects(request)](#Projects+listProjects) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
    * [.createProject(request)](#Projects+createProject) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
    * [.getProject(ref)](#Projects+getProject) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
    * [.updateProject(request)](#Projects+updateProject) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
    * [.deleteProject(ref)](#Projects+deleteProject)
    * [.renewAccessKeySecret(request)](#Projects+renewAccessKeySecret)

<a name="new_Projects_new"></a>

### new Projects(options)
Constructs a new Projects object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const Projects = new Fonoster.Projects()

const request = {
  name: "project002",
  allowExperiments: false
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Projects_new"></a>

### new Projects(options)
Constructs a new Projects object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const Projects = new Fonoster.Projects()

const request = {
  name: "project002",
  allowExperiments: false
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Projects_new"></a>

### new Projects(options)
Constructs a new Projects object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const Projects = new Fonoster.Projects()

const request = {
  name: "project002",
  allowExperiments: false
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="new_Projects_new"></a>

### new Projects(options)
Constructs a new Projects object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const Projects = new Fonoster.Projects()

const request = {
  name: "project002",
  allowExperiments: false
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+listProjects"></a>

### projects.listProjects(request) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
Returns a list of Projects

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListProjectsRequest</code> | Reserved for future filters |

**Example**  
```js
projects.listProjects({})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+createProject"></a>

### projects.createProject(request) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
Creates a new Project

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateProjectRequest</code> | Request to create a new Project |
| request.name | <code>string</code> | Project's name |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  allowExperiments: true
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+getProject"></a>

### projects.getProject(ref) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
Retrives an Project by reference.

**Kind**: instance method of [<code>Projects</code>](#Projects)  
**Returns**: <code>Promise.&lt;GetProjectResponse&gt;</code> - The Project  
**Throws**:

- if ref is null or Project does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Project |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

projects.getProject(ref)
.then(result => {
  console.log(result)             // returns the Project payload
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+updateProject"></a>

### projects.updateProject(request) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
Updates an Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateProjectRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Required reference to the Project |
| request.name | <code>string</code> | Value to rename the application to |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  ref: "507f1f77bcf86cd799439011"
}

projects.updateProject(request)
.then(result => {
  console.log(result)            // returns the UpdateProjectResponse payload
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+deleteProject"></a>

### projects.deleteProject(ref)
Deletes a Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Project's reference |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011"

projects.deleteProject(ref)
.then(() => {
  console.log("done")            // returns a reference of the Project
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+renewAccessKeySecret"></a>

### projects.renewAccessKeySecret(request)
Generates a new accessKeySecret. Be sure to update your applications with the new value.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>LoginRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Project's reference |

**Example**  
```js
const request = {
 ref: "507f1f77bcf86cd799439011"
}

projects.renewAccessKeySecret(request)
.then(result => {
  console.log(result)            // returns the new accessKeySecret
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+listProjects"></a>

### projects.listProjects(request) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
Returns a list of Projects

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListProjectsRequest</code> | Reserved for future filters |

**Example**  
```js
projects.listProjects({})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+createProject"></a>

### projects.createProject(request) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
Creates a new Project

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateProjectRequest</code> | Request to create a new Project |
| request.name | <code>string</code> | Project's name |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  allowExperiments: true
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+getProject"></a>

### projects.getProject(ref) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
Retrives an Project by reference.

**Kind**: instance method of [<code>Projects</code>](#Projects)  
**Returns**: <code>Promise.&lt;GetProjectResponse&gt;</code> - The Project  
**Throws**:

- if ref is null or Project does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Project |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

projects.getProject(ref)
.then(result => {
  console.log(result)             // returns the Project payload
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+updateProject"></a>

### projects.updateProject(request) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
Updates an Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateProjectRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Required reference to the Project |
| request.name | <code>string</code> | Value to rename the application to |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  ref: "507f1f77bcf86cd799439011"
}

projects.updateProject(request)
.then(result => {
  console.log(result)            // returns the UpdateProjectResponse payload
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+deleteProject"></a>

### projects.deleteProject(ref)
Deletes a Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Project's reference |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011"

projects.deleteProject(ref)
.then(() => {
  console.log("done")            // returns a reference of the Project
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+renewAccessKeySecret"></a>

### projects.renewAccessKeySecret(request)
Generates a new accessKeySecret. Be sure to update your applications with the new value.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>LoginRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Project's reference |

**Example**  
```js
const request = {
 ref: "507f1f77bcf86cd799439011"
}

projects.renewAccessKeySecret(request)
.then(result => {
  console.log(result)            // returns the new accessKeySecret
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+listProjects"></a>

### projects.listProjects(request) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
Returns a list of Projects

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListProjectsRequest</code> | Reserved for future filters |

**Example**  
```js
projects.listProjects({})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+createProject"></a>

### projects.createProject(request) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
Creates a new Project

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateProjectRequest</code> | Request to create a new Project |
| request.name | <code>string</code> | Project's name |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  allowExperiments: true
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+getProject"></a>

### projects.getProject(ref) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
Retrives an Project by reference.

**Kind**: instance method of [<code>Projects</code>](#Projects)  
**Returns**: <code>Promise.&lt;GetProjectResponse&gt;</code> - The Project  
**Throws**:

- if ref is null or Project does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Project |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

projects.getProject(ref)
.then(result => {
  console.log(result)             // returns the Project payload
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+updateProject"></a>

### projects.updateProject(request) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
Updates an Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateProjectRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Required reference to the Project |
| request.name | <code>string</code> | Value to rename the application to |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  ref: "507f1f77bcf86cd799439011"
}

projects.updateProject(request)
.then(result => {
  console.log(result)            // returns the UpdateProjectResponse payload
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+deleteProject"></a>

### projects.deleteProject(ref)
Deletes a Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Project's reference |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011"

projects.deleteProject(ref)
.then(() => {
  console.log("done")            // returns a reference of the Project
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+renewAccessKeySecret"></a>

### projects.renewAccessKeySecret(request)
Generates a new accessKeySecret. Be sure to update your applications with the new value.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>LoginRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Project's reference |

**Example**  
```js
const request = {
 ref: "507f1f77bcf86cd799439011"
}

projects.renewAccessKeySecret(request)
.then(result => {
  console.log(result)            // returns the new accessKeySecret
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+listProjects"></a>

### projects.listProjects(request) ⇒ <code>Promise.&lt;ListProjectsResponse&gt;</code>
Returns a list of Projects

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>ListProjectsRequest</code> | Reserved for future filters |

**Example**  
```js
projects.listProjects({})
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+createProject"></a>

### projects.createProject(request) ⇒ <code>Promise.&lt;CreateProjectResponse&gt;</code>
Creates a new Project

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateProjectRequest</code> | Request to create a new Project |
| request.name | <code>string</code> | Project's name |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  allowExperiments: true
}

projects.createProject(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+getProject"></a>

### projects.getProject(ref) ⇒ <code>Promise.&lt;GetProjectResponse&gt;</code>
Retrives an Project by reference.

**Kind**: instance method of [<code>Projects</code>](#Projects)  
**Returns**: <code>Promise.&lt;GetProjectResponse&gt;</code> - The Project  
**Throws**:

- if ref is null or Project does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to Project |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

projects.getProject(ref)
.then(result => {
  console.log(result)             // returns the Project payload
}).catch(e => console.error(e))   // an error occurred
```
<a name="Projects+updateProject"></a>

### projects.updateProject(request) ⇒ <code>Promise.&lt;UpdateProjectResponse&gt;</code>
Updates an Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateProjectRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Required reference to the Project |
| request.name | <code>string</code> | Value to rename the application to |
| request.allowExperiments | <code>string</code> | Enables experimental APIs |

**Example**  
```js
const request = {
  name: "project001",
  ref: "507f1f77bcf86cd799439011"
}

projects.updateProject(request)
.then(result => {
  console.log(result)            // returns the UpdateProjectResponse payload
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+deleteProject"></a>

### projects.deleteProject(ref)
Deletes a Project.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Project's reference |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011"

projects.deleteProject(ref)
.then(() => {
  console.log("done")            // returns a reference of the Project
}).catch(e => console.error(e))  // an error occurred
```
<a name="Projects+renewAccessKeySecret"></a>

### projects.renewAccessKeySecret(request)
Generates a new accessKeySecret. Be sure to update your applications with the new value.

**Kind**: instance method of [<code>Projects</code>](#Projects)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>LoginRequest</code> | Request update of an Project |
| request.ref | <code>string</code> | Project's reference |

**Example**  
```js
const request = {
 ref: "507f1f77bcf86cd799439011"
}

projects.renewAccessKeySecret(request)
.then(result => {
  console.log(result)            // returns the new accessKeySecret
}).catch(e => console.error(e))  // an error occurred
```
