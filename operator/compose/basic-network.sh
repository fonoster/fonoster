#!/bin/bash

COMPOSE_CMD="docker-compose --env-file .env -f 00_config.yml -f 01_api.yml -f 02_sipnet.yml -f extras/datasource.yml -f extras/fs.yml"

basic_network() {
  case $1 in
    start)
      eval $COMPOSE_CMD" -f letsencrypt.yml up -d"
      ;;
    start-unsecure)
      eval $COMPOSE_CMD" -f noencrypt.yml up -d"
      ;;      
    stop)
      eval $COMPOSE_CMD" -f noencrypt.yml down"
      ;;
    *)
      echo -n "Usage: ./basic_network start|start-unsecure|stop"
      echo ""
      ;;
  esac
}

basic_network $1
