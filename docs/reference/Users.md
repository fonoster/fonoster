<a name="Users"></a>

## Users ⇐ <code>APIClient</code>
Use Fonoster Users, a capability of Fonoster,
to create, update, get and delete Users. Users requires of a
running Fonoster deployment.

**Kind**: global class  
**Extends**: <code>APIClient</code>  
**See**: module:core:APIClient  

* [Users](#Users) ⇐ <code>APIClient</code>
    * [new Users(options)](#new_Users_new)
    * [.createUser(request)](#Users+createUser) ⇒ <code>Promise.&lt;CreateUserResponse&gt;</code>
    * [.getUser(ref)](#Users+getUser) ⇒ <code>Promise.&lt;GetUserResponse&gt;</code>
    * [.updateUser(request)](#Users+updateUser) ⇒ <code>Promise.&lt;UpdateUserResponse&gt;</code>
    * [.deleteUser(ref)](#Users+deleteUser)
    * [.createUserCredentials(request)](#Users+createUserCredentials)

<a name="new_Users_new"></a>

### new Users(options)
Constructs a new Users object.


| Param | Type | Description |
| --- | --- | --- |
| options | <code>ClientOptions</code> | Options to indicate the objects endpoint |

**Example**  
```js
const Fonoster = require("@fonoster/sdk")
const Users = new Fonoster.Users()

const request = {
  email: "john.doe@email.com",
  name: "John Doe",
  secret: "s3cur3pass",
  avatar: "https://avatar.com/avt?userId=2124252"
}

Users.createUser(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Users+createUser"></a>

### users.createUser(request) ⇒ <code>Promise.&lt;CreateUserResponse&gt;</code>
Creates a new User on Fonoster.

**Kind**: instance method of [<code>Users</code>](#Users)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>CreateUserRequest</code> | Request for the provision of a new User |
| request.email | <code>string</code> | User's email |
| request.name | <code>string</code> | User's full name |
| request.secret | <code>string</code> | Login password |
| request.avatar | <code>string</code> | Optional URL to User's avatar |

**Example**  
```js
const request = {
  email: "john.doe@email.com",
  name: "John Doe",
  secret: "s3cur3pass",
  avatar: "https://avatar.com/avt?userId=2124252"
}

Users.createUser(request)
.then(result => {
  console.log(result)             // successful response
}).catch(e => console.error(e))   // an error occurred
```
<a name="Users+getUser"></a>

### users.getUser(ref) ⇒ <code>Promise.&lt;GetUserResponse&gt;</code>
Retrives an User by reference.

**Kind**: instance method of [<code>Users</code>](#Users)  
**Returns**: <code>Promise.&lt;GetUserResponse&gt;</code> - The User  
**Throws**:

- if ref is null or User does not exist


| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | Reference to User |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011";

Users.getUser(ref)
.then(result => {
  console.log(result)             // returns the User payload
}).catch(e => console.error(e))   // an error occurred
```
<a name="Users+updateUser"></a>

### users.updateUser(request) ⇒ <code>Promise.&lt;UpdateUserResponse&gt;</code>
Updates an User.

**Kind**: instance method of [<code>Users</code>](#Users)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>UpdateUserRequest</code> | Request update of an User |
| request.ref | <code>string</code> | Required reference to the User |
| request.name | <code>string</code> | Optionally update the name |
| request.avatar | <code>string</code> | Optionally update the avatar |
| request.secret | <code>string</code> | Optionally update User's password |

**Example**  
```js
const request = {
  name: "John Dee",
  secret: "s3cur3pass"
}

Users.updateUser(request)
.then(result => {
  console.log(result)            // returns the UpdateUserResponse payload
}).catch(e => console.error(e))  // an error occurred
```
<a name="Users+deleteUser"></a>

### users.deleteUser(ref)
Deletes an User.

**Kind**: instance method of [<code>Users</code>](#Users)  

| Param | Type | Description |
| --- | --- | --- |
| ref | <code>string</code> | User's reference |

**Example**  
```js
const ref = "507f1f77bcf86cd799439011"

Users.deleteUser(ref)
.then(() => {
  console.log("done")            // returns a reference of the User
}).catch(e => console.error(e))  // an error occurred
```
<a name="Users+createUserCredentials"></a>

### users.createUserCredentials(request)
Login using email and a password.

**Kind**: instance method of [<code>Users</code>](#Users)  

| Param | Type | Description |
| --- | --- | --- |
| request | <code>createUserCredentials</code> | Request update of an User |
| request.email | <code>string</code> | Login username |
| request.secret | <code>string</code> | Login password |

**Example**  
```js
const request = {
 email: "john.doe@email.com",
 secret: "s3cur3pass",
 expiration: "30d"
}

Users.createUserCredentials(request)
.then(result => {
  console.log(result)            // returns an accessKeyId and accessKeySecret
}).catch(e => console.error(e))  // an error occurred
```
