const access = [
  "/fonos.usermanager.v1alpha1.UserManager/ListUsers",
  "/fonos.usermanager.v1alpha1.UserManager/GetUser",
  "/fonos.usermanager.v1alpha1.UserManager/CreateUser",
  "/fonos.usermanager.v1alpha1.UserManager/UpdateUser",
  "/fonos.usermanager.v1alpha1.UserManager/DeleteUser",
  "/fonos.storage.v1alpha1.Storage/UploadObject",
  "/fonos.storage.v1alpha1.Storage/GetObjectURL",
  "/fonos.providers.v1alpha1.Providers/ListProviders",
  "/fonos.providers.v1alpha1.Providers/CreateProvider",
  "/fonos.providers.v1alpha1.Providers/GetProvider",
  "/fonos.providers.v1alpha1.Providers/UpdateProvider",
  "/fonos.providers.v1alpha1.Providers/DeleteProvider",
  "/fonos.numbers.v1alpha1.Numbers/ListNumbers",
  "/fonos.numbers.v1alpha1.Numbers/CreateNumber",
  "/fonos.numbers.v1alpha1.Numbers/GetIngressApp",
  "/fonos.numbers.v1alpha1.Numbers/GetNumber",
  "/fonos.numbers.v1alpha1.Numbers/UpdateNumber",
  "/fonos.numbers.v1alpha1.Numbers/DeleteNumber",
  "/fonos.domains.v1alpha1.Domains/ListDomains",
  "/fonos.domains.v1alpha1.Domains/CreateDomain",
  "/fonos.domains.v1alpha1.Domains/GetDomain",
  "/fonos.domains.v1alpha1.Domains/UpdateDomain",
  "/fonos.domains.v1alpha1.Domains/DeleteDomain",
  "/fonos.callmanager.v1alpha1.CallManager/Call",
  "/fonos.appmanager.v1alpha1.AppManager/ListApps",
  "/fonos.appmanager.v1alpha1.AppManager/GetApp",
  "/fonos.appmanager.v1alpha1.AppManager/CreateApp",
  "/fonos.appmanager.v1alpha1.AppManager/UpdateApp",
  "/fonos.appmanager.v1alpha1.AppManager/DeleteApp",
  "/fonos.agents.v1alpha1.Agents/ListAgents",
  "/fonos.agents.v1alpha1.Agents/CreateAgent",
  "/fonos.agents.v1alpha1.Agents/GetAgent",
  "/fonos.agents.v1alpha1.Agents/UpdateAgent",
  "/fonos.agents.v1alpha1.Agents/DeleteAgent"
];

const roles = [
  {
    role: "GUEST",
    description: "With access to createUser",
    access: ["/fonos.usermanager.v1alpha1.UserManager/CreateUser"]
  },
  {
    role: "USER",
    description: "Access to everything",
    access: access
  },
  {
    role: "ADMIN",
    description: "Access to everything",
    access: access
  }
];

db = db.getSiblingDB("fonos_auth");
db.roles.insertMany(roles);
db.users.ensureIndex({ email: 1, type: 1 }, { unique: true });

// WARNING: Harcoded value
db.createUser({ user: "fonos", pwd: "changeit", roles: ["dbOwner"] });
