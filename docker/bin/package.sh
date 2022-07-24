#!/bin/bash

# Check if the command is installed on the system
function command_is_installed() {
  [[ -z "$*" ]] && error "No command provided"

  for command in "$@"; do
    info "Checking if command '$command' is installed..."

    if ! type "$command" >/dev/null 2>&1; then
      error "The command '$command' not installed. Please, install it first."
    fi
  done
}

# Install Package Globally
function package_install_global() {
  [[ -z "$*" ]] && error "No packages provided"

  command_is_installed "npm"

  for package in "$@"; do
    if npm ls -g "$package" --depth=0 | grep "$package" >/dev/null 2>&1; then
      info "The package $package is already installed globally"
    else
      info "Installing $package global package..."
      execute "npm install -g $package"
    fi
  done
}

# Install Package Locally
function package_install() {
  [[ -z "$*" ]] && error "No packages provided"

  command_is_installed "npm"

  for package in "$@"; do
    if npm ls "$package" --depth=0 | grep "$package" >/dev/null 2>&1; then
      info "The package $package is already installed locally"
    else
      info "Installing $package local package..."
      execute "npm install $package"
    fi
  done
}
