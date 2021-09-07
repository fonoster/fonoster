# Adding Support for Secrets (Experimental)

Project Fonos offers experimental support for Secret management based on [Hashicorp Vault](https://www.vaultproject.io/).

As with anything related to managing data, we recommend using a [managed service](https://www.hashicorp.com/blog/vault-on-the-hashicorp-cloud-platform) to back your secrets. However, to help you get started, we include a basic Vault deployment as part of the operator's scripts.

To run Vault, first, you need to go to the configuration folder. If you used Cloud-Init, you will find it at: `/opt/fonos/config`

Download Vault's configuration files with:

```bash
cd /opt/fonos/config
curl https://raw.githubusercontent.com/fonoster/fonos/main/etc/vault.json -o /opt/fonos/config/vault.json
curl https://raw.githubusercontent.com/fonoster/fonos/main/etc/vault_policy.hcl -o /opt/fonos/config/vault_policy.hcl
```

Then, run your Vault' service with:

```bash
cd /opt/fonos/operator
docker-compose -f extras/secrets.yml up -d
```

Next, find Vault's container ID id with: 

```bash
docker ps -q  --filter="ancestor=vault"` 
```

Your out will look like this:

```
21af58423205
```

Access the container with:

```bash
# Remember to use the ID in your output
docker exec -it 21af58423205 sh
```

Now you can initialize Vault. First, you need to tell Vault's client where the server is with:

```
export VAULT_ADDR=http://localhost:8200
```

Next, initialize the server with:

```bash
vault operator init
```

This will produce an output like the one bellow:

```bash
Unseal Key 1: WdFJ8RvhDggh2l+1roo2QfuxMtpYRL4sog3wpeQrKIR9
Unseal Key 2: y74ZIMaKxjDren41ZMToVCRElwKTaTCw4V4MQG/OTvrx
Unseal Key 3: lQKMVh6IaSwhKp1zlyGz02kxS//DEOlgIZYZauHdPeXg
Unseal Key 4: 2yQQcqEQj3alqUr4FhEbpZsRulkBWN7hvzR3C8W5TvV3
Unseal Key 5: alfffxchI8tYiJwEBkWS4CMIPd0OGMPL2C2h+iulR5uR

Initial Root Token: s.23OL31TAw1MarBDp34O6B2p6

Vault initialized with 5 key shares and a key threshold of 3. Please securely
distribute the key shares printed above. When the Vault is re-sealed,
restarted, or stopped, you must supply at least 3 of these keys to unseal it
before it can start servicing requests.

Vault does not store the generated master key. Without at least 3 key to
reconstruct the master key, Vault will remain permanently sealed!

It is possible to generate new unseal keys, provided you have a quorum of
existing unseal keys shares. See "vault operator rekey" for more information.
```

> For simplicity, we will use the Root Token to continue the guide, but you should not do that for anything other than a test. 

Now that we have the unseal keys, we need to unseal Vault. By default, Vault uses a key threshold of 3. Therefore, you will need to run the following command three times with a different unseal key.

```bash
vault operator unseal
```

The last time you run the command, you will get an output like the one below, showing that Vault is unsealed.

```bash
Unseal Key (will be hidden): 
Key             Value
---             -----
Seal Type       shamir
Initialized     true
Sealed          false
Total Shares    5
Threshold       3
Version         1.7.3
Storage Type    file
Cluster Name    vault-cluster-9eee5261
Cluster ID      1d6859a5-cc74-5c68-61f7-7cbc5a6953ef
HA Enabled      false
```

Then export the token as follows:

```
# Remember to replace this with your token
export VAULT_TOKEN=s.23OL31TAw1MarBDp34O6B2p6
```

Next, copy Vault's policy file somewhere in the container and run the following lines

```bash
vault policy write fonos-policy vault_policy.hcl
vault secrets enable -path=secret kv
vault auth enable approle
```

Output:

```bash
Success! Uploaded policy: fonos-policy
Success! Enabled the kv secrets engine at: secret/
Success! Enabled approle auth method at: approle/
```

Once Vault has been unsealed and configured, we need to turn our attention back to our Fonos deployment. Open your `.env` file at `/opt/fonos/operator` and scan for the word "SECRETS."

Once you find the variables, uncomment the variables and replace the token with your own. In the end it should look like this:

```bash
SECRETS_IMAGE=vault
SECRETS_URL=http://secrets:8200
SECRETS_POLICY=fonos-policy
SECRETS_TOKEN=s.yDSlcyHGNvm9YOpJSVHbPYXI
```

Finally, restart the deployment to apply the last changes.