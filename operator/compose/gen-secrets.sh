#!/bin/bash

function generateSecrets() {
  openssl rand -hex 16
}

MS_ARI_USERNAME=$(grep MS_ARI_USERNAME .env | cut -d '=' -f2)
MS_ARI_SECRET=$(generateSecrets)
FS_SECRET=$(generateSecrets)
SIPPROXY_SECRET=$(generateSecrets)
SIPPROXY_API_SECRET=$(generateSecrets)
DS_SECRET=$(generateSecrets)
MS_ARI_AUTHORIZATION=$(printf ${MS_ARI_USERNAME}:${MS_ARI_SECRET} | base64)

sed -i.bak \
  -e "s#MS_ARI_SECRET=.*#MS_ARI_SECRET=${MS_ARI_SECRET}#g" \
  -e "s#MS_ARI_AUTHORIZATION=.*#MS_ARI_AUTHORIZATION=${MS_ARI_AUTHORIZATION}#g" \
  -e "s#FS_SECRET=.*#FS_SECRET=${FS_SECRET}#g" \
  -e "s#SIPPROXY_SECRET=.*#SIPPROXY_SECRET=${SIPPROXY_SECRET}#g" \
  -e "s#SIPPROXY_API_SECRET=.*#SIPPROXY_API_SECRET=${SIPPROXY_API_SECRET}#g" \
  -e "s#DS_SECRET=.*#DS_SECRET=${DS_SECRET}#g" \
  "$(dirname "$0")/.env"
