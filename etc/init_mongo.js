db.createUser({
    user: 'mongo',
    pwd: 'changeit',
    roles: [
        {
            role: 'readWrite',
            db: 'auth'
        }
    ]
})

let roles = [
    {
        role:"GUEST",
        description:"With access to createUser",
        access:[
            "/fonos.usermanager.v1alpha1.UserManager/CreateUser"
        ]
    },
    {
        role:"USER",
        description:"Access to everything",
        access:[
            "/fonos.usermanager.v1alpha1.UserManager/ListUsers",
            "/fonos.usermanager.v1alpha1.UserManager/GetUser",
            "/fonos.usermanager.v1alpha1.UserManager/CreateUser",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateUser",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteUser",
            "/fonos.usermanager.v1alpha1.UserManager/UploadObject",
            "/fonos.usermanager.v1alpha1.UserManager/GetObjectURL",
            "/fonos.usermanager.v1alpha1.UserManager/ListProviders",
            "/fonos.usermanager.v1alpha1.UserManager/CreateProvider",
            "/fonos.usermanager.v1alpha1.UserManager/GetProvider",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateProvider",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteProvider",
            "/fonos.usermanager.v1alpha1.UserManager/ListNumbers",
            "/fonos.usermanager.v1alpha1.UserManager/CreateNumber",
            "/fonos.usermanager.v1alpha1.UserManager/GetIngressApp",
            "/fonos.usermanager.v1alpha1.UserManager/GetNumber",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateNumber",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteNumber",
            "/fonos.usermanager.v1alpha1.UserManager/ListDomains",
            "/fonos.usermanager.v1alpha1.UserManager/CreateDomain",
            "/fonos.usermanager.v1alpha1.UserManager/GetDomain",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateDomain",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteDomain",
            "/fonos.usermanager.v1alpha1.UserManager/Call",
            "/fonos.usermanager.v1alpha1.UserManager/ListApps",
            "/fonos.usermanager.v1alpha1.UserManager/GetApp",
            "/fonos.usermanager.v1alpha1.UserManager/CreateApp",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateApp",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteApp",
            "/fonos.usermanager.v1alpha1.UserManager/ListAgents",
            "/fonos.usermanager.v1alpha1.UserManager/CreateAgent",
            "/fonos.usermanager.v1alpha1.UserManager/GetAgent",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateAgent",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteAgent",
        ] 
    },
    {
        role:"ADMIN",
        description:"Access to everything",
        access:[
            "/fonos.usermanager.v1alpha1.UserManager/ListUsers",
            "/fonos.usermanager.v1alpha1.UserManager/GetUser",
            "/fonos.usermanager.v1alpha1.UserManager/CreateUser",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateUser",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteUser",
            "/fonos.usermanager.v1alpha1.UserManager/UploadObject",
            "/fonos.usermanager.v1alpha1.UserManager/GetObjectURL",
            "/fonos.usermanager.v1alpha1.UserManager/ListProviders",
            "/fonos.usermanager.v1alpha1.UserManager/CreateProvider",
            "/fonos.usermanager.v1alpha1.UserManager/GetProvider",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateProvider",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteProvider",
            "/fonos.usermanager.v1alpha1.UserManager/ListNumbers",
            "/fonos.usermanager.v1alpha1.UserManager/CreateNumber",
            "/fonos.usermanager.v1alpha1.UserManager/GetIngressApp",
            "/fonos.usermanager.v1alpha1.UserManager/GetNumber",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateNumber",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteNumber",
            "/fonos.usermanager.v1alpha1.UserManager/ListDomains",
            "/fonos.usermanager.v1alpha1.UserManager/CreateDomain",
            "/fonos.usermanager.v1alpha1.UserManager/GetDomain",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateDomain",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteDomain",
            "/fonos.usermanager.v1alpha1.UserManager/Call",
            "/fonos.usermanager.v1alpha1.UserManager/ListApps",
            "/fonos.usermanager.v1alpha1.UserManager/GetApp",
            "/fonos.usermanager.v1alpha1.UserManager/CreateApp",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateApp",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteApp",
            "/fonos.usermanager.v1alpha1.UserManager/ListAgents",
            "/fonos.usermanager.v1alpha1.UserManager/CreateAgent",
            "/fonos.usermanager.v1alpha1.UserManager/GetAgent",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateAgent",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteAgent",
        ] 
    }
]
use fonos
db.roles.insertMany(roles);