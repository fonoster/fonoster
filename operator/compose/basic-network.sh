#!/bin/bash

basic_network() {
  EXTRAS="-f extras/datasource.yml -f extras/fs.yml"
  SERVICES=(
    "logging.yml"
    "health.yml"
    "00_config.yml"
    "01_api.yml"
    "02_sipnet.yml"
  )

  [ -z "$EXTRA_SERVICES" ] && EXTRA_SERVICES=$EXTRAS

  COMPOSE_CMD="docker-compose --env-file .env -f logging.yml -f health.yml -f 00_config.yml -f 01_api.yml -f 02_sipnet.yml ${EXTRA_SERVICES}"

  case $1 in
    start)
      eval "$COMPOSE_CMD -f letsencrypt.yml up -d"
      ;;
    start-unsecure)
      eval "$COMPOSE_CMD -f noencrypt.yml up -d"
      ;;      
    stop)
      eval "$COMPOSE_CMD -f noencrypt.yml down"
      ;;
    *)
      echo -n "Usage: ./basic_network start|start-unsecure|stop"
      echo ""
      ;;
  esac
}

basic_network "$1"
