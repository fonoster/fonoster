#!/bin/sh
# Routr for the API cases, in CI and on a laptop: a `routr` database on the Postgres at
# 127.0.0.1:5432 (user and password postgres), migrated, then RoutrOne with routr.yaml, its Data API
# on 127.0.0.1:51907 taking the key in ROUTR_API_KEY. The image pins match ops/bundle/compose.yaml.
#
#   ROUTR_API_KEY=<key> mods/conformance/test/api/start-routr.sh
set -eu

DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION=3.1.2
: "${ROUTR_API_KEY:?set ROUTR_API_KEY}"
# The containers reach the host's Postgres through host.docker.internal (Linux and Docker Desktop).
HOST="--add-host=host.docker.internal:host-gateway"
PG="postgresql://postgres:postgres@host.docker.internal:5432"

exists="$(docker run --rm $HOST postgres:18.6-alpine3.24 \
  psql "$PG/postgres" -tAc "SELECT 1 FROM pg_database WHERE datname = 'routr'")"
[ "$exists" = 1 ] || docker run --rm $HOST postgres:18.6-alpine3.24 \
  psql "$PG/postgres" -qc "CREATE DATABASE routr"

docker run --rm $HOST -e DATABASE_URL="$PG/routr" "fonoster/routr-pgdata-migrations:$VERSION"

docker run -d --name routr $HOST -p 127.0.0.1:51907:51907 \
  -e ROUTR_API_KEY -e ROUTR_DATABASE_URL="$PG/routr" \
  -v "$DIR/routr.yaml:/etc/routr/routr.yaml:ro" "fonoster/routr-one:$VERSION" >/dev/null

i=0
until nc -z 127.0.0.1 51907 2>/dev/null; do
  i=$((i + 1))
  [ "$i" -lt 60 ] || { docker logs routr; exit 1; }
  sleep 2
done
