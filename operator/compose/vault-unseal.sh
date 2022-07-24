#!/bin/bash

# Enter Vault keys in the environment variables bellow, 
# and keep in mind that this is a bad idea for production environments
KEY1=
KEY2=
KEY3=
KEYS=(${KEY1} ${KEY2} ${KEY3})

# Find the container name for vault instance
CONTAINER_NAME=fonoster_secrets_1

CONTAINER_ID=$(docker ps --no-trunc -aqf name=${CONTAINER_NAME})

for key in "${KEYS[@]}"; do
  docker exec -it "${CONTAINER_ID}" sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault operator unseal ${key}"
done
