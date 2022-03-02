#!/bin/bash

function line() {
  echo " "
}

function prefix() {
  local message

  message=$(echo "$1" | awk '{print toupper($0)}')

  echo -e "[$message]:"
}

function error() {
  for err in "$@"; do
    echo -e "🔥 $(prefix "error") $err"
  done

  exit 1
}

function info() {
  echo -e "🔔 $(prefix "info") $1"
}

function input() {
  echo -n "📥 $(prefix "input") $1"
}

function warning() {
  echo -e "⚠️  $(prefix "warning") $1"
}
