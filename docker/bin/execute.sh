#!/bin/bash

function execute() {
  [[ -z "$*" ]] && error "No commands provided"

  for command in "$@"; do
    info "Executing command: $command ..."

    if ! $command; then
      error "Failed to execute command: '$command'"
    fi
  done
}
