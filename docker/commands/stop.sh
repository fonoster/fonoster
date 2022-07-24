#!/bin/bash

function stop() {
  local VERSION COMPOSE_PROJECT_VERSION

  info "Stopping Fonoster application... 🚀 "

  execute "cd /out/operator"

  [ -f .env ] || error "You don't have a Fonoster application installed in this directory. Please, install it first."

  VERSION=$FONOSTER_VERSION
  COMPOSE_PROJECT_VERSION=$(grep COMPOSE_PROJECT_VERSION .env | cut -d '=' -f2)

  EXTRA_SERVICES=$(grep EXTRA_SERVICES .env | cut -d '=' -f2)

  [ -z "$VERSION" ] && VERSION=$FONOSTER_LATEST_VERSION
  [ -z "$COMPOSE_PROJECT_VERSION" ] && error "Could not get the current version of Fonoster application."

  info "Stop Fonoster application... 🚨 "
  execute "bash ./basic-network.sh down"

}
