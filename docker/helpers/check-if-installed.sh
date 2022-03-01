#!/bin/bash

# Validate that there is no project installation in the current directory
function check_if_installed() {
  PROJECT_ENV="/out/operator/.env"

  if [[ -f $PROJECT_ENV ]]; then
    error "You already have a project installed in this directory. Please, remove the current installation first as this may cause issues."
  fi
}
