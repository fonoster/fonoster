#!/bin/bash

function get_latest_version() {
  local LATEST_VERSION PROJECT_TMP

  PROJECT_TMP="fonoster-tmp"

  info "Getting latest version of Fonoster..."
  execute "git clone https://github.com/fonoster/fonoster --depth=1 -b main --single-branch $PROJECT_TMP"

  LATEST_VERSION=$(cat $PROJECT_TMP/lerna.json | grep version | cut -d ':' -f2 | cut -d '"' -f2)

  execute "rm -rf $PROJECT_TMP"

  [ -z "$LATEST_VERSION" ] && error "Could not get the latest version of Fonoster application."

  echo "$LATEST_VERSION"
}
