#!/bin/bash

set -e

CONTAINER_ID=$(docker ps --no-trunc -aqf name=vault)
if [ -z "$CONTAINER_ID" ]; then
  echo "Vault container not found. Please ensure it is running."
  exit 1
fi

docker exec -it -e VAULT_ADDR=http://localhost:8200 $CONTAINER_ID vault operator init -key-shares=1 -key-threshold=1 | sed -r "s/\x1B\[[0-9;]*[a-zA-Z]//g" > /tmp/vault_init_output

UNSEAL_KEY=$(cat /tmp/vault_init_output | grep 'Unseal Key' | awk '{print $4}' | tr -d '\r')
ROOT_TOKEN=$(cat /tmp/vault_init_output | grep 'Initial Root Token' | awk '{print $4}' | tr -d '\r')

sed -i '.bak' "s|APISERVER_VAULT_TOKEN=.*|APISERVER_VAULT_TOKEN=${ROOT_TOKEN}|g" .env 
sed -i '.bak' "s|APISERVER_VAULT_UNSEAL_KEY=.*|APISERVER_VAULT_UNSEAL_KEY=${UNSEAL_KEY}|g" .env

docker cp ./etc/vault_policy.hcl $CONTAINER_ID:/vault/config/vault_policy.hcl
docker exec -it -e VAULT_ADDR=http://localhost:8200 $CONTAINER_ID vault operator unseal ${UNSEAL_KEY}
docker exec -it -e VAULT_ADDR=http://localhost:8200 -e VAULT_TOKEN=${ROOT_TOKEN} $CONTAINER_ID sh -c 'vault policy write fonoster-secrets-policy /vault/config/vault_policy.hcl && vault secrets enable -path=secret kv && vault auth enable approle'

echo "vault initialization complete!"
