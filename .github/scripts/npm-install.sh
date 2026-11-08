#!/usr/bin/env bash
# npm install with retries. protoc-gen-grpc-web's postinstall downloads its binary from GitHub
# releases, which answers 504 now and then when many jobs start at once; npm's own retries don't
# cover postinstall downloads.
set -uo pipefail
attempts=4
for i in $(seq 1 "$attempts"); do
  npm install --no-audit --no-fund "$@" && exit 0
  [ "$i" -lt "$attempts" ] || break
  echo "npm install failed (attempt $i of $attempts); retrying in $((i * 15)) s" >&2
  sleep $((i * 15))
done
exit 1
