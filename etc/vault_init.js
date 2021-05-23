const Vault = require("node-vault");

const options = {
  apiVersion: "v1", // default
  endpoint: "http://api.fonoster.net:8200" // default
};

// eslint-disable-next-line new-cap
// get new instance of the client
const vault = Vault(options);

// init vault server
vault
  .init({secret_shares: 1, secret_threshold: 1})
  .then((result) => {
    const keys = result.keys;
    // set token for all following requests
    vault.token = result.root_token;

    console.log("keys: " + JSON.stringify(keys));
    console.log("token: " + result.root_token);

    // unseal vault server
    return vault.unseal({secret_shares: 1, key: keys[0]});
  })
  .catch(console.error);
