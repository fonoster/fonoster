#!/bin/bash

COMPOSE_CMD="docker-compose --env-file .env -f 00_config.yml -f 01_api.yml -f 02_sipnet.yml -f extras/datasource.yml -f extras/fs.yml -f noencrypt.yml"

basic_network() {
  case $1 in
    start)
      eval $COMPOSE_CMD" up -d"
      ;;
    stop)
      eval $COMPOSE_CMD" down"
      ;;
    *)
      echo -n "Usage: ./basic_network start|stop"
      echo ""
      ;;
  esac
}

basic_network $1
