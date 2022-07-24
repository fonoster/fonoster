#!/bin/bash

function get_latest_version() {
  local PROJECT_TMP="fonoster-tmp"

  if [ -z "$FONOSTER_LATEST_VERSION" ]; then
    info "Getting latest version of Fonoster... 🔍 "
    execute "git clone https://github.com/fonoster/fonoster --quiet --depth=1 -b 0.3 --single-branch $PROJECT_TMP"

    FONOSTER_LATEST_VERSION=$(cat $PROJECT_TMP/lerna.json | grep version | cut -d ':' -f2 | cut -d '"' -f2)
    execute "rm -rf $PROJECT_TMP"
  fi

  [ -z "$FONOSTER_LATEST_VERSION" ] && error "Could not get the latest version of Fonoster application."

  export FONOSTER_LATEST_VERSION
}
