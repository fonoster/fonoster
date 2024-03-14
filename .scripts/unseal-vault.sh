#!/bin/bash

source .env

# Check if the variable exists
if [[ -z "${APISERVER_VAULT_UNSEAL_KEY}" ]]; then
  echo "Error: APISERVER_VAULT_UNSEAL_KEY not found in .env file!"
  exit 1
fi

# Get container details
CONTAINER_NAME=vault
CONTAINER_ID=$(docker ps --no-trunc -aqf name=${CONTAINER_NAME})

# Use the unseal key from the .env file
docker exec -it ${CONTAINER_ID} sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault operator unseal ${APISERVER_VAULT_UNSEAL_KEY}"

echo "Unsealed Vault using key from .env file."