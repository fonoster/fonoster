let access = [
            "/fonos.usermanager.v1alpha1.UserManager/ListUsers",
            "/fonos.usermanager.v1alpha1.UserManager/GetUser",
            "/fonos.usermanager.v1alpha1.UserManager/CreateUser",
            "/fonos.usermanager.v1alpha1.UserManager/UpdateUser",
            "/fonos.usermanager.v1alpha1.UserManager/DeleteUser",
            "/fonos.usermanager.v1alpha1.Storage/UploadObject",
            "/fonos.usermanager.v1alpha1.Storage/GetObjectURL",
            "/fonos.usermanager.v1alpha1.Providers/ListProviders",
            "/fonos.usermanager.v1alpha1.Providers/CreateProvider",
            "/fonos.usermanager.v1alpha1.Providers/GetProvider",
            "/fonos.usermanager.v1alpha1.Providers/UpdateProvider",
            "/fonos.usermanager.v1alpha1.Providers/DeleteProvider",
            "/fonos.usermanager.v1alpha1.Numbers/ListNumbers",
            "/fonos.usermanager.v1alpha1.Numbers/CreateNumber",
            "/fonos.usermanager.v1alpha1.Numbers/GetIngressApp",
            "/fonos.usermanager.v1alpha1.Numbers/GetNumber",
            "/fonos.usermanager.v1alpha1.Numbers/UpdateNumber",
            "/fonos.usermanager.v1alpha1.Numbers/DeleteNumber",
            "/fonos.usermanager.v1alpha1.Domains/ListDomains",
            "/fonos.usermanager.v1alpha1.Domains/CreateDomain",
            "/fonos.usermanager.v1alpha1.Domains/GetDomain",
            "/fonos.usermanager.v1alpha1.Domains/UpdateDomain",
            "/fonos.usermanager.v1alpha1.Domains/DeleteDomain",
            "/fonos.usermanager.v1alpha1.CallManager/Call",
            "/fonos.usermanager.v1alpha1.AppManager/ListApps",
            "/fonos.usermanager.v1alpha1.AppManager/GetApp",
            "/fonos.usermanager.v1alpha1.AppManager/CreateApp",
            "/fonos.usermanager.v1alpha1.AppManager/UpdateApp",
            "/fonos.usermanager.v1alpha1.AppManager/DeleteApp",
            "/fonos.usermanager.v1alpha1.Agents/ListAgents",
            "/fonos.usermanager.v1alpha1.Agents/CreateAgent",
            "/fonos.usermanager.v1alpha1.Agents/GetAgent",
            "/fonos.usermanager.v1alpha1.Agents/UpdateAgent",
            "/fonos.usermanager.v1alpha1.Agents/DeleteAgent",
        ] 

let roles =  [
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
        access:access
    },
    {
        role:"ADMIN",
        description:"Access to everything",
        access:access
    }
]
use fonos
db.roles.insertMany(roles);
