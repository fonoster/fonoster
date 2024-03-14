#!/bin/bash

# For production you will want to have more shares and a higher threshold
CONTAINER_NAME=vault
CONTAINER_ID=$(docker ps --no-trunc -aqf name=${CONTAINER_NAME})

docker exec -it ${CONTAINER_ID} sh -c "VAULT_ADDR=http://localhost:8200 vault operator init -key-shares=1 -key-threshold=1"
