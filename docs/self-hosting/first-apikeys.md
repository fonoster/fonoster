# First API Keys

Fonoster uses a Workspace-centric approach, meaning all operations are performed against a specific Workspace. By default, when you self-host Fonoster, it automatically creates a default Workspace along with a default username and password.

```text
Default accessKeyId: WO00000000000000000000000000000000
Default username: admin@fonoster.local
Default password: changeme
```

You will need to create API keys to log in to a Workspace and perform operations.

## Create an API Key

First create a new folder (e.g., fonoster-apikeys-demo) and navigate into it.

```bash
mkdir fonoster-apikeys-demo
cd fonoster-apikeys-demo
```

Then, initialize a new Node.js project.

```bash
npm init -y
```

Next, install the `@fonoster/sdk` package.

```bash
npm install @fonoster/sdk
```

Once the installation is complete, create a new file called `index.js` and add the following code:

```javascript
const SDK = require("@fonoster/sdk");

// Replace these with your actual values
const client = new SDK.Client({ 
  accessKeyId: "WO00000000000000000000000000000000",
  endpoint: "localhost:50051",
  allowInsecure: true
});

// Use your actual username and password here
client.login("admin@fonoster.local", "changeme").then(async () => {
  const apikeys = new SDK.ApiKeys(client);

  apikeys.createApiKey({
    role: "WORKSPACE_ADMIN",
  }).then((result) => {
    console.log(result);
  });
});
```

Finally, run the script.

```bash
node index.js
```

If everything goes well, you should see the new API key printed to the console and you can use it to log in to your Workspace.
