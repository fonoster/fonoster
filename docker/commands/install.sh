#!/bin/bash

function install() {
  info "Checking if the application is already installed..."
  check_if_installed

  [ -z "$HTTP_PORT" ] && HTTP_PORT=50051
  [ -z "$HTTPS_PORT" ] && HTTPS_PORT=443

  info "Checking if the required ports are available..."
  check_ports "$HTTP_PORT" "$HTTPS_PORT"

  # Get the latest version of the application from the GitHub repository
  get_latest_version

  [ -z "$FONOSTER_VERSION" ] && FONOSTER_VERSION=$FONOSTER_LATEST_VERSION
  check_version "$FONOSTER_VERSION"

  info "Installing Fonoster... 📦 "
  execute "cd /work"

  info "Generating private key... 🔑 "
  {
    openssl rand -hex 16
  } >config/private_key

  info "Configuring docker host and sets environment variables... 💻 "
  [ -z "$DOCKER_HOST_IP" ] && DOCKER_HOST_IP=$(netdiscover -field publicv4)

  {
    echo ""
    echo "DOCKER_HOST_ADDRESS=$DOCKER_HOST_IP"
    echo "RTPE_HOST=$DOCKER_HOST_IP"
  } >>operator/.env

  info "Configuring domain... 🌐 "
  [ -z "$DOMAIN" ] && DOMAIN=$DOCKER_HOST_IP

  if [ "$ENABLE_TLS" = "true" ]; then
    [ -z "$LETSENCRYPT_EMAIL" ] && LETSENCRYPT_EMAIL="admin@$DOMAIN"

    {
      echo "LETSENCRYPT_DOMAIN=$DOMAIN"
      echo "LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL"
      echo "PUBLIC_URL=https://$DOMAIN"
    } >>operator/.env

  else
    echo "PUBLIC_URL=http://$DOMAIN:$HTTP_PORT" >>operator/.env
  fi

  [ "$GLOBAL_SIP_DOMAIN" ] && {
    echo "GLOBAL_SIP_DOMAIN=$GLOBAL_SIP_DOMAIN" >>operator/.env
  }

  info "Generating service secrets... 🔑 "
  execute "cd operator" "./gen-secrets.sh"

  DS_SECRET=$(grep DS_SECRET .env | cut -d '=' -f2)
  SIPPROXY_SECRET=$(grep SIPPROXY_SECRET .env | cut -d '=' -f2)
  sed -i.bak -e "s#requirepass .*#requirepass ${DS_SECRET}#g" "./../config/redis.conf"
  sed -i.bak -e "s#changeit#${SIPPROXY_SECRET}#g" "./../config/bootstrap.yml"
  sed -i.bak -e "s#CONFIG=/opt/fonoster/config#CONFIG=$CONFIG_PATH#g" ".env"
  sed -i.bak -e "s#HTTP_PORT=50051#HTTP_PORT=$HTTP_PORT#g" ".env"
  sed -i.bak -e "s#HTTPS_PORT=50051#HTTPS_PORT=$HTTPS_PORT#g" ".env"
  sed -i.bak -e "s#COMPOSE_PROJECT_VERSION=.*#COMPOSE_PROJECT_VERSION=$FONOSTER_VERSION#g" ".env"
  sed -i.bak -e "s#EXTRA_SERVICES=.*#EXTRA_SERVICES=$EXTRA_SERVICES#g" ".env"

  info "Copying the application to the output directory... 📁 "
  execute "cp -a /work/* /out"

  info "Creating volumes for minio(s3 buckets) and redis... 💾 "
  execute "docker volume create --name=datasource" "docker volume create --name=data1-1" "docker volume create --name=esdata1"

  info "Creating service and user credentials... 🔑 "
  execute "docker-compose -f init.yml up service_creds user_creds"

  if [ "$ENABLE_TLS" = "true" ]; then
    execute "bash ./basic-network.sh start"
  else
    execute "bash ./basic-network.sh start-unsecure"
  fi

  while [ "$(docker ps -f health=healthy | grep fonoster/routr)" == "" ]; do
    info "Waiting for Routr to be ready... 🕐 "
    sleep 15
  done

  info "Bootstrapping sip-proxy and creating initial buckets... 💾 "
  execute "docker-compose -f init.yml up create_buckets bootstrap_sipnet"
}
