#!/bin/bash

function execute() {
  [[ -z "$*" ]] && error "No commands provided"

  for command in "$@"; do
    info "Executing command: $command ..."

    if ! $command >/dev/null 2>&1; then
      error "Failed to execute command: '$command' ⭕ "
    else
      info "Successfully executed command: '$command' ✅ "
    fi
  done
}
