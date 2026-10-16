#!/bin/sh
# The region agent image's entrypoint: `run` applies the apiserver migrations to the cell's
# database (a cell has no apiserver), then starts the agent; anything else is the CLI.
set -e
if [ "$1" = "run" ] && [ -n "${APISERVER_DATABASE_URL:-}" ]; then
  attempts=0
  until prisma migrate deploy --schema /work/mods/apiserver/schema.prisma; do
    attempts=$((attempts + 1))
    [ "$attempts" -ge 30 ] && exit 1
    echo "waiting for the cell database…"; sleep 2
  done
fi
exec fonoster-region "$@"
