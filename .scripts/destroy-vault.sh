#!/bin/bash

set -e

CONTAINER_ID=$(docker ps --no-trunc -aqf name=vault)
if [ -z "$CONTAINER_ID" ]; then
  echo "Vault container not found. Nothing to destroy."
  exit 0
fi

docker stop $CONTAINER_ID
docker rm $CONTAINER_ID
docker volume rm fonoster_vault
echo "vault destroyed."