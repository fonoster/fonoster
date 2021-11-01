#!/bin/bash

# Replace with your own keys, but keep in mind that this is a bad idea
#   for production environments
KEY1=tuSoeBR3xkKwb2VtOFCKadA3TOu5GSiu2/jUvBxBbfvd
KEY2=vc3w+pwKz3hRDxkXQZieZLnDA16dX+bxwGyE2Uu2e0ha
KEY3=ARwmV6h/m4nyCdXdOvlNR8yzlb4M2u/lVZKHIEQ7H8vI
KEYS=(${KEY1} ${KEY2} ${KEY3})

# Find the container name for vault instance
CONTAINER_NAME=fonoster_secrets_1

CONTAINER_ID=$(docker ps --no-trunc -aqf name=${CONTAINER_NAME})

for key in "${KEYS[@]}"
do 
  docker exec -it ${CONTAINER_ID} sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault operator unseal ${key}"
done
