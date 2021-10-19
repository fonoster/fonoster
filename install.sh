#!/bin/bash

set -e

echo "installing fonos"
cd /work

echo "generating private key"

echo $(openssl rand -hex 16) > config/private_key
echo "" >> operator/.env

echo "configuring docker host"

[ -z "$DOCKER_HOST_IP" ] && DOCKER_HOST_IP=$(netdiscover -field publicv4)

echo "DOCKER_HOST_ADDRESS=$DOCKER_HOST_IP" >> operator/.env
echo "RTPE_HOST=$DOCKER_HOST_IP" >> operator/.env

echo "configuring domain"

[ -z "$DOMAIN" ] && DOMAIN=$DOCKER_HOST_IP

if [ "$ENABLE_TLS" = "true" ]; then
  [ -z "$LETSENCRYPT_EMAIL" ] && LETSENCRYPT_EMAIL="admin@$DOMAIN"
  echo "LETSENCRYPT_DOMAIN=$DOMAIN" >> operator/.env
  echo "LETSENCRYPT_EMAIL=$LETSENCRYPT_EMAIL" >> operator/.env
  echo "PUBLIC_URL=https://$DOMAIN" >> operator/.env 
else
  echo "PUBLIC_URL=http://$DOMAIN:50051" >> operator/.env 
fi

[ "$GLOBAL_SIP_DOMAIN" ] && {
  echo "GLOBAL_SIP_DOMAIN=$GLOBAL_SIP_DOMAIN" >> operator/.env
}

[ -z "$HTTP_PORT" ] && HTTP_PORT=50051
[ -z "$HTTPS_PORT" ] && HTTPS_PORT=443

echo "creating service secrets"

cd operator

./gen-secrets.sh
DS_SECRET=$(grep DS_SECRET .env | cut -d '=' -f2)
SIPPROXY_SECRET=$(grep SIPPROXY_SECRET .env | cut -d '=' -f2)
sed -i.bak -e "s#requirepass .*#requirepass ${DS_SECRET}#g" "./../config/redis.conf"
sed -i.bak -e "s#changeit#${SIPPROXY_SECRET}#g" "./../config/bootstrap.yml"
sed -i.bak -e "s#CONFIG=/opt/fonos/config#CONFIG=$CONFIG_PATH#g" ".env"
sed -i.bak -e "s#HTTP_PORT=50051#HTTP_PORT=$HTTP_PORT#g" ".env"
sed -i.bak -e "s#HTTPS_PORT=50051#HTTPS_PORT=$HTTPS_PORT#g" ".env"
sed -i.bak -e "s#COMPOSE_PROJECT_VERSION=.*#COMPOSE_PROJECT_VERSION=$FONOS_VERSION#g" ".env"

cp -a /work/* /out

echo "creating volumes for minio(s3 buckets) and redis"

docker volume create --name=datasource
docker volume create --name=data1-1

echo "creating service and user credentials"
docker-compose -f init.yml up service_creds user_creds

if [ "$ENABLE_TLS" = "true" ]; then
  ./basic-network.sh start
else
  ./basic-network.sh start-unsecure
fi

echo "please wait..."
sleep 30

echo "bootstraping sipproxy and creating initial buckets"
docker-compose -f init.yml up create_buckets bootstrap_sipnet
