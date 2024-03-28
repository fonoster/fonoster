#!/bin/bash

set -e

curl -s -o remote.env https://raw.githubusercontent.com/fonoster/fonoster/main/.env.example

grep -o '^[^=]*' remote.env | sort > remote_envs.txt 
grep -o '^[^=]*' .env | sort > local_envs.txt

# Find differences
echo "Envs in remote but not local:"
comm -23 remote_envs.txt local_envs.txt

echo ""
echo "Envs in local but not remote:"
comm -13 remote_envs.txt local_envs.txt

rm remote.env remote_envs.txt local_envs.txt 