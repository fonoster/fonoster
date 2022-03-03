#!/bin/bash

function set_env() {
  DS_SECRET=$(grep DS_SECRET .env | cut -d '=' -f2)
  SIPPROXY_SECRET=$(grep SIPPROXY_SECRET .env | cut -d '=' -f2)

  sed -i.bak -e "s#requirepass .*#requirepass ${DS_SECRET}#g" "./../config/redis.conf"
  sed -i.bak -e "s#changeit#${SIPPROXY_SECRET}#g" "./../config/bootstrap.yml"

  [ -n "$CONFIG_PATH" ] && sed -i.bak -e "s#CONFIG=/opt/fonoster/config#CONFIG=$CONFIG_PATH#g" ".env"
  [ -n "$HTTP_PORT" ] && sed -i.bak -e "s#HTTP_PORT=51051#HTTP_PORT=$HTTP_PORT#g" ".env"
  [ -n "$HTTPS_PORT" ] && sed -i.bak -e "s#HTTPS_PORT=51051#HTTPS_PORT=$HTTPS_PORT#g" ".env"

  [ -n "$FONOSTER_VERSION" ] && sed -i.bak -e "s#COMPOSE_PROJECT_VERSION=.*#COMPOSE_PROJECT_VERSION=$FONOSTER_VERSION#g" ".env"
  [ -n "$EXTRA_SERVICES" ] && sed -i.bak -e "s#EXTRA_SERVICES=.*#EXTRA_SERVICES=$EXTRA_SERVICES#g" ".env"
  [ -n "$SECRETS_TOKEN" ] && sed -i.bak -e "s#SECRETS_TOKEN=.*#SECRETS_TOKEN=$SECRETS_TOKEN#g" ".env"
  [ -n "$SECRETS_URL" ] && sed -i.bak -e "s#SECRETS_URL=.*#SECRETS_URL=$SECRETS_URL#g" ".env"
  [ -n "$DS_HOST" ] && sed -i.bak -e "s#DS_HOST=.*#DS_HOST=$DS_HOST#g" ".env"
  [ -n "$DS_SECRET" ] && sed -i.bak -e "s#DS_SECRET=.*#DS_SECRET=$DS_SECRET#g" ".env"
}
