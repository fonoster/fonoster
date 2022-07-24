#!/bin/bash

function error() {
  echo -e "🔥 [ERROR]: $1"
  echo " "
  exit 1
}

function basic_network() {
  local COMPOSE_CMD COMPOSE_FILES SERVICES DEFAULT_SERVICES DEFAULT_IFS

  DEFAULT_IFS=$IFS

  DEFAULT_SERVICES=(
    "fs"
    "datasource"
  )

  SERVICES=(
    "logging"
    "health"
    "00_config"
    "01_api"
    "02_sipnet"
  )

  echo -e "Checking basic network... 🌐 \n"

  IFS=,
  if [ -n "$EXTRA_SERVICES" ]; then
    echo -e "Getting extra services... 🔍 \n"

    for service in $EXTRA_SERVICES; do
      [[ $service = *.yml ]] && error "Service $service must not have .yml extension"
      [[ $service = extras/* ]] && error "Service $service must not contain 'extras/'"

      SERVICES+=("extras/$service")
    done
  fi

  IFS=$DEFAULT_IFS

  echo -e "Checking and adding default services... 🔍 \n"
  for service in "${DEFAULT_SERVICES[@]}"; do
    EXTRA_SERVICE="extras/${service}"

    if [[ ! "${SERVICES[*]}" =~ $EXTRA_SERVICE ]]; then

      # Skip datasource service if DS_HOST and DS_SECRET env vars are set
      [[ $EXTRA_SERVICE = "extras/datasource" && -n $DS_HOST && -n $DS_SECRET ]] && continue

      SERVICES+=("$EXTRA_SERVICE")
    fi
  done

  for service in "${SERVICES[@]}"; do
    local SERVICE_PATH="${service}.yml"

    if [ -f "$SERVICE_PATH" ]; then
      COMPOSE_FILES+="-f $SERVICE_PATH "
    else
      echo -e "Service $SERVICE_PATH not found. This service will not be started. \n"
    fi
  done

  COMPOSE_CMD="docker compose --env-file .env ${COMPOSE_FILES[*]}"

  case $1 in
  start)
    eval "$COMPOSE_CMD -f letsencrypt.yml up -d --remove-orphans"
    ;;
  start-unsecure)
    eval "$COMPOSE_CMD -f noencrypt.yml up -d --remove-orphans"
    ;;
  stop | down)
    eval "$COMPOSE_CMD -f noencrypt.yml down"
    ;;
  *)
    echo -e "Usage: basic_network start|start-unsecure|stop \n"
    ;;
  esac
}

basic_network "$@"
