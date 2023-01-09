#!/bin/bash

COMMAND_LOGS="/var/log/fonoster.log"

function exec_command() {
  local COMMAND="$1"

  if [ -n "$VERBOSE" ]; then
    eval "$COMMAND"
  else
    eval "$COMMAND" >>$COMMAND_LOGS 2>&1
  fi
}

function execute() {
  [[ -z "$*" ]] && error "No commands provided"

  for command in "$@"; do
    info "Executing command: $command... 🏁 "

    if ! exec_command "$command"; then
      warning "Failed to execute command: '$command'"

      if [ -f $COMMAND_LOGS ]; then
        line

        if [ -z "$VERBOSE" ]; then
          warning "Last 10 lines of execution logs: 👀 "

          line

          echo " -------------------------------------------------- "
          echo -e "\n $(tail -10 $COMMAND_LOGS) \n"
          echo " -------------------------------------------------- "

          line

          info "To see the full logs, open the file: $COMMAND_LOGS"
        fi

        line
      fi

      error "Unable to continue. Exiting... ⭕ "
    else
      info "Successfully executed command: '$command' ✅ "
    fi
  done
}
