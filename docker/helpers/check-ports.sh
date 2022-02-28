#!/bin/bash

# Validate the required ports are available for the application
function check_ports() {
    for port in "$@"; do
        [ -z "$port" ] && error "Port '$port' is not a valid port"

        PORT_USED="$(netstat -lnt | awk '{print $4}' | grep -E ":$port$")"

        if [ -n "$PORT_USED" ]; then
            warning "Port '$port' is already in use by another process, please stop the process and try again."

            echo -e "$PORT_USED"

            warning "Another option is run the container with the '-e HTTPS_PORT' option to specify a different port."

            error "Unable to continue. Exiting..."
        fi
    done
}
