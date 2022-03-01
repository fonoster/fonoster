#!/bin/bash

# Validate the required ports are available for the application
function check_ports() {
    for port in "$@"; do
        [ -z "$port" ] && error "Port '$port' is not a valid port"

        CONTAINER_USING_PORT="$(docker ps --format "table {{.ID}}\t{{.Ports}}" | grep -E ":$port" | awk '{print $1}')"

        if [ -n "$CONTAINER_USING_PORT" ]; then
            warning "Port '$port' is already in use by the container '$CONTAINER_USING_PORT', please stop the process and try again."
            warning "Another option is run the container with the (e.g. '-e HTTPS_PORT') option to specify a different port."

            error "Unable to continue. Exiting..."
        fi
    done
}
