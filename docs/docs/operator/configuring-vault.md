# Configuring Vault


Fonoster offers support for Secret management based on [Hashicorp Vault](https://www.vaultproject.io/).

As with anything related to managing data, we recommend using a [managed service](https://www.hashicorp.com/blog/vault-on-the-hashicorp-cloud-platform) to back your secrets. However, to help you get started, we include a basic Vault deployment as part of the operator's scripts.

Create an empty folder download Vault's configuration files with:

```bash
mkdir vault
cd vault
curl -o vault.json https://raw.githubusercontent.com/fonoster/fonoster/main/etc/vault.json
curl -o vault_policy.hcl https://raw.githubusercontent.com/fonoster/fonoster/main/etc/vault_policy.hcl
```

To get your Vault container ID, run:

```bash
CONTAINER_ID=$(docker ps --no-trunc -aqf name=vault)
```

Set the Vault address:

```bash
export VAULT_ADDR=http://localhost:8200
```

Now, initialize Vault:

```bash
docker exec -it -e VAULT_ADDR=$VAULT_ADDR $CONTAINER_ID vault operator init -key-shares=1 -key-threshold=1
```

This will produce an output with an unseal key and the initial root token.

Unseal Vault using the unseal key:

```bash
docker exec -it -e VAULT_ADDR=$VAULT_ADDR $CONTAINER_ID vault operator unseal <UnsealKey>
```

Set the root token environment variable:

```bash
export VAULT_TOKEN=<InitialRootToken>
```

Finally, configure Vault policies and enable secrets and authentication methods:

```bash
docker exec -it -e VAULT_ADDR=$VAULT_ADDR -e VAULT_TOKEN=$VAULT_TOKEN $CONTAINER_ID vault policy write fonoster-secrets-policy /vault/config/vault_policy.hcl
docker exec -it -e VAULT_ADDR=$VAULT_ADDR -e VAULT_TOKEN=$VAULT_TOKEN $CONTAINER_ID vault secrets enable -path=secret kv
docker exec -it -e VAULT_ADDR=$VAULT_ADDR -e VAULT_TOKEN=$VAULT_TOKEN $CONTAINER_ID vault auth enable approle
```

> Make sure to save the root token and unseal key in a safe place. You will need them to configure the operator and to unseal Vault in case of a restart.

