#!/bin/bash

# Replace with your own keys, but keep in mind that this is a bad idea
#   for production environments
KEY1=0fzxUcvJ+Q3D/0FR55VJo29Y8nbxEN74l0otqzfhZ7qH
KEY2=cGJLQV+WrSzHq1PhvFkkgQG1MR8XXez1hhCQ99UqaLtu
KEY3=iiXvUrHOqdeTDE+ZHxdetE8Upnf7dvjCubOMgAFgMKLt

echo $KEY1

KEYS=(${KEY1} ${KEY2} ${KEY3})

# Find the container name for vault instance
CONTAINER_NAME=vault

CONTAINER_ID=$(docker ps --no-trunc -aqf name=${CONTAINER_NAME})

for key in "${KEYS[@]}"
do 
  docker exec -it ${CONTAINER_ID} sh -c "VAULT_ADDR=http://127.0.0.1:8200 vault operator unseal ${key}"
done