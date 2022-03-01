#!/bin/bash

function dir() {
  [[ -z "$*" ]] && error "No directories provided"

  for directory in "$@"; do
    if [ ! -d "$directory" ]; then
      mkdir -p "$directory"
    else
      warning "The directory '$directory' already exists"
    fi
  done
}
