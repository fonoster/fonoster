#!/bin/bash

function check_version() {
  local CURRENT="$1"
  local LATEST=$FONOSTER_LATEST_VERSION

  info "Checking version... 🔍 "

  if [[ "$(semver validate "$CURRENT")" == "invalid" ]]; then
    error "Invalid version: $CURRENT"
  fi

  COMPARE_VERSION=$(semver compare "$CURRENT" "$LATEST")

  if [[ $COMPARE_VERSION == "1" ]]; then
    error "The version is greater than the latest version: $CURRENT > $LATEST"
  elif [[ $COMPARE_VERSION == "-1" ]]; then
    info "The version $CURRENT is less than the latest version. You can update your application to the latest version: $LATEST"
  fi
}

function is_patch_of() {
  local PATCH_VERSION="$1"
  local VERSION="$2"

  [ -z "$PATCH_VERSION" ] && error "The patch version is empty."
  [ -z "$VERSION" ] && error "The version is empty."

  COMPARE_VERSION=$(semver compare "$PATCH_VERSION" "$VERSION")

  if [[ $COMPARE_VERSION == "0" &&
    "$(semver get patch "$PATCH_VERSION")" != "$(semver get patch "$VERSION")" ]]; then
    echo "true"
    return
  else
    echo "false"
    return
  fi
}
