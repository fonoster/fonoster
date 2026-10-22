#!/usr/bin/env sh
# Throwaway Routr rig for the live Routr test (routr.live.test.ts).
#   ./rig.sh up     start Postgres + Routr (migrations run on start) and wait for SIP
#   ./rig.sh test   run the live test against it (needs CONFORMANCE_NATS_URL and Go)
#   ./rig.sh env    print the variables the test needs (ROUTR_LIVE, ROUTR_LIVE_HOST_ADDR)
#   ./rig.sh logs   follow Routr's logs
#   ./rig.sh down   remove the containers
# See docs/operators/routr-live-test.md.
set -eu
cd "$(dirname "$0")"
ROOT="$(cd ../../../.. && pwd)"

wait_for_sip() {
  printf "waiting for Routr SIP on 127.0.0.1:15560"
  i=0
  while [ $i -lt 120 ]; do
    if printf 'REGISTER sip:rig.local SIP/2.0\r\nVia: SIP/2.0/UDP 127.0.0.1:5999;branch=z9hG4bKrig%s;rport\r\nFrom: <sip:probe@rig.local>;tag=1\r\nTo: <sip:probe@rig.local>\r\nCall-ID: rig-probe-%s\r\nCSeq: 1 REGISTER\r\nMax-Forwards: 70\r\nContent-Length: 0\r\n\r\n' "$i" "$i" \
      | nc -u -w 1 127.0.0.1 15560 2>/dev/null | grep -q '^SIP/2.0'; then
      echo " ready"
      return 0
    fi
    printf "."
    i=$((i + 1))
    sleep 2
  done
  echo " timed out"
  docker logs --tail 30 rb-cutover-routr
  return 1
}

# host.docker.internal's IPv4 as containers see it (how Routr reaches the node and the caller bot).
# --add-host makes the name resolve on Linux too (Docker Desktop defines it already).
host_addr() {
  docker run --rm --add-host host.docker.internal:host-gateway alpine:3.20 \
    getent ahostsv4 host.docker.internal | awk 'NR==1 {print $1}'
}

case "${1:-}" in
  up)
    docker compose -f compose.yaml up -d
    wait_for_sip
    ;;
  env)
    # The variables the live test needs, one KEY=value a line (the QA catalog's ROM-034):
    # export $(rig.sh env), or append them to $GITHUB_ENV.
    echo "ROUTR_LIVE=1"
    echo "ROUTR_LIVE_HOST_ADDR=$(host_addr)"
    ;;
  test)
    : "${CONFORMANCE_NATS_URL:?set CONFORMANCE_NATS_URL (a NATS server for media-control)}"
    ROUTR_LIVE_HOST_ADDR="${ROUTR_LIVE_HOST_ADDR:-$(host_addr)}"
    export ROUTR_LIVE=1 ROUTR_LIVE_HOST_ADDR
    cd "$ROOT"
    LOGS_LEVEL="${LOGS_LEVEL:-none}" npx mocha --exit --timeout 60000 mods/appbridge/test/routr.live.test.ts
    ;;
  logs)
    docker logs -f rb-cutover-routr
    ;;
  down)
    docker compose -f compose.yaml down -v
    ;;
  *)
    echo "usage: $0 up | env | test | logs | down" >&2
    exit 2
    ;;
esac
