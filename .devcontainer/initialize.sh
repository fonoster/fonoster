#!/bin/sh
# Writes the dev config in .dev/ with `fonoster-config init` (the self-host installer) plus the dev
# layer in .devcontainer/config/. Secrets are generated there and never committed.
#
#   .devcontainer/initialize.sh             on the host, each time the editor starts the dev
#                                           container (initializeCommand); rewrites .dev/ only
#                                           when .dev/config/tls/server.pem or
#                                           .dev/config/routr-rtprelay.yaml is missing (otherwise
#                                           run npm run dev:config); needs only a POSIX shell and
#                                           Docker
#   .devcontainer/initialize.sh --refresh   inside the workspace (npm run dev:config): copy the
#                                           bundle's examples again, add new names, render again;
#                                           every secret is kept
#
# FONOSTER_DEV_<NAME> in the environment sets <NAME> when .dev/.env is first written, e.g.
# FONOSTER_DEV_HTTPS_PORT=18449 or FONOSTER_DEV_HOST_IP=192.168.1.20 (the address softphones and
# the browser reach this machine at; detected otherwise).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEV="$ROOT/.dev"
BUNDLE="$ROOT/ops/bundle"
MODE="${1:-host}"

log() { printf '[dev-config] %s\n' "$*" >&2; }
die() { printf '[dev-config] %s\n' "$*" >&2; exit 1; }

# HOST_IP is written into .dev/.env when it is first created, and RTPEngine and Routr put it in every
# SDP and Via. When the machine changes network (home to hotspot, VPN, another office) it goes stale
# and calls connect without audio. The host detects its address on each container start and leaves it
# in .dev/host-ip.detected; the refresh inside the workspace, which cannot see the host's network,
# compares that file with .dev/.env.
env_host_ip() { sed -n 's/^HOST_IP=//p' "$DEV/.env" 2>/dev/null | head -n 1; }

warn_stale_host_ip() {
  configured="$(env_host_ip)"
  detected="$(cat "$DEV/host-ip.detected" 2>/dev/null || true)"
  [ -n "$configured" ] && [ -n "$detected" ] && [ "$configured" != "$detected" ] || return 0
  log "WARNING: HOST_IP in $DEV/.env is $configured, but this machine is now at $detected."
  log "         RTPEngine and Routr advertise $configured, so calls will connect without audio."
  log "         To fix it: set HOST_IP=$detected in .dev/.env, run npm run dev:config, then recreate"
  log "         the two containers (docker compose -p fonoster-dev -f .devcontainer/compose.yaml"
  log "         --env-file .dev/.env up -d --no-deps rtpengine routr) and restart npm run dev."
}

# The rendered Routr files (not the bundle's *.example.yaml), each with its checksum: taken before
# a refresh and compared after it, to name the ones that changed. The running Routr keeps its old
# image and mounts until it is recreated on the host, which the workspace has no Docker to do.
routr_sums() {
  for f in "$DEV"/config/routr-*.yaml; do
    case "$f" in *.example.yaml) continue ;; esac
    [ -f "$f" ] && printf '%s %s\n' "$(basename "$f")" "$(cksum < "$f")"
  done
  return 0
}

hint_routr_recreate() {
  changed=""
  for f in "$DEV"/config/routr-*.yaml; do
    case "$f" in *.example.yaml) continue ;; esac
    [ -f "$f" ] || continue
    name="$(basename "$f")"
    old="$(printf '%s\n' "$1" | awk -v n="$name" '$1 == n { sub(/^[^ ]+ /, ""); print }')"
    [ "$old" = "$(cksum < "$f")" ] || changed="${changed:+$changed, }$name"
  done
  [ -n "$changed" ] || return 0
  # --force-recreate: Compose doesn't hash a bind-mounted file's content. No -p: .dev/.env sets
  # COMPOSE_PROJECT_NAME.
  log "changed: $changed. The running Routr keeps its old image and config until it is recreated. On the host, from the repository root:"
  log "  docker compose -f .devcontainer/compose.yaml --env-file .dev/.env up -d --no-deps --force-recreate routr"
}

[ "$MODE" = "--refresh" ] && routr_before="$(routr_sums)"

# Compose reads .devcontainer/.env: the same values as the dev config.
ln -sfn ../.dev/.env "$ROOT/.devcontainer/.env"

# The workspace image, built here rather than by Compose: Compose 5 builds through Bake, which
# refuses the Dockerfile the dev-container client writes outside the build context ("additional
# privileges requested"). Cached after the first build.
if [ "$MODE" = "host" ]; then
  command -v docker >/dev/null 2>&1 || die "Docker is required"
  log "building the workspace image (fonoster-dev-workspace)"
  docker build -q -t fonoster-dev-workspace "$ROOT/.devcontainer" >/dev/null \
    || die "could not build .devcontainer/Dockerfile"
fi

# Before HTTPS was the default, the dev PUBLIC_URL was plain HTTP: move it to the new default (an
# edited value is kept).
migrate_public_url() {
  [ -f "$DEV/.env" ] || return 0
  if grep -q '^PUBLIC_URL=http://localhost:\${HTTP_PORT}$' "$DEV/.env"; then
    sed -i.bak 's#^PUBLIC_URL=http://localhost:\${HTTP_PORT}$#PUBLIC_URL=https://localhost:${HTTPS_PORT}#' "$DEV/.env"
    rm -f "$DEV/.env.bak"
    log "PUBLIC_URL is https://localhost:\${HTTPS_PORT} now (HTTPS is the default)"
  fi
}

# An existing .dev/ is kept, unless it predates HTTPS by default (no certificate in
# .dev/config/tls/) or the rtprelay profiles (no .dev/config/routr-rtprelay.yaml, which the routr
# service mounts): then init runs again below, which keeps every secret.
if [ "$MODE" = "host" ] && [ -f "$DEV/.env" ] && [ -f "$DEV/config/tls/server.pem" ] && [ -f "$DEV/config/routr-rtprelay.yaml" ]; then
  detected="${FONOSTER_DEV_HOST_IP:-$(detect_host_ip)}"
  [ -z "$detected" ] || printf '%s\n' "$detected" > "$DEV/host-ip.detected"
  warn_stale_host_ip
  # A .dev made before #1200 holds its generated server key 0600, which Routr's user (uid 5000)
  # can't read on Linux or in a Codespace; init writes it 0644, and a kept .dev gets the same mode
  # here. The file is always the generated key: an own certificate lives where TLS_KEY points.
  [ ! -f "$DEV/config/tls/server-key.pem" ] || chmod 0644 "$DEV/config/tls/server-key.pem"
  log "keeping $DEV (npm run dev:config renders it again)"
  exit 0
fi

# The machine's LAN address: RTPEngine writes it in SDP for the browser, softphones and the media
# node alike, so it must be reachable from the host and from the containers.
detect_host_ip() {
  ip=""
  if command -v ipconfig >/dev/null 2>&1; then
    ifc="$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}')"
    [ -n "$ifc" ] && ip="$(ipconfig getifaddr "$ifc" 2>/dev/null || true)"
    [ -z "$ip" ] && ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  fi
  if [ -z "$ip" ] && command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") {print $(i + 1); exit}}')"
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  echo "$ip"
}

# The bundle's examples, then .dev/.env.example: the bundle's .env.example with the dev defaults
# (and FONOSTER_DEV_<NAME> overrides). init fills the secrets and adds names a newer bundle brings.
mkdir -p "$DEV/config"
cp -R "$BUNDLE/config/." "$DEV/config/"
awk -v config_dir="$DEV/config" '
  BEGIN {
    dev["COMPOSE_PROJECT_NAME"] = "fonoster-dev"
    # Apart from a self-hosted install on the same machine (10.216.30).
    dev["SUBNET_PREFIX"] = "10.216.31"
    # HTTPS on 8449 with the certificate init generates in .dev/config/tls/ (browsers warn once;
    # the workspace trusts its CA through FONOSTER_CA_FILE). The redirect on 8448.
    dev["HTTPS_PORT"] = "8449"
    dev["HTTPS_REDIRECT_PORT"] = "8448"
    dev["HTTP_PORT"] = "18449"
    dev["PUBLIC_URL"] = "https://localhost:${HTTPS_PORT}"
  }
  /^[A-Za-z_][A-Za-z0-9_]*=/ {
    name = substr($0, 1, index($0, "=") - 1)
    if (("FONOSTER_DEV_" name) in ENVIRON) { print name "=" ENVIRON["FONOSTER_DEV_" name]; next }
    if (name in dev) { print name "=" dev[name]; next }
  }
  { print }
  END {
    print ""
    print "# The dev container: where Compose finds the rendered config (absolute, on the host)."
    print "CONFIG_DIR=" config_dir
  }
' "$BUNDLE/.env.example" > "$DEV/.env.example"

migrate_public_url

if [ "$MODE" = "--refresh" ]; then
  # Inside the workspace: the built CLI (post-create builds it), else the source through tsx.
  warn_stale_host_ip
  cd "$ROOT"
  if [ -f mods/common/dist/config/cli/index.js ]; then
    cli() { node mods/common/dist/config/cli/index.js "$@"; }
  else
    cli() { npx --no-install tsx mods/common/src/config/cli/index.ts "$@"; }
  fi
  cli init --dir .dev >/dev/null
  cli render --dir .dev --config-dir .dev/config --env-file .dev/.env \
    --overlay .devcontainer/config --overlay .dev/overlay
  log "rendered $DEV (secrets kept)"
  hint_routr_recreate "$routr_before"
  exit 0
fi

command -v docker >/dev/null 2>&1 || die "Docker is required"
host_ip="${FONOSTER_DEV_HOST_IP:-$(detect_host_ip)}"
[ -n "$host_ip" ] || die "could not find this machine's LAN address: set FONOSTER_DEV_HOST_IP and reopen"

# The real installer, from source, in a throwaway container: no Node needed on the host. Its two
# dependencies are installed there (versions from package-lock.json).
log "writing $DEV with fonoster-config init (host address $host_ip)"
docker run --rm --quiet -v "$ROOT:/src" -w /src -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  -e HOST_IP="$host_ip" -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  node:22-alpine sh -ec '
    npm install --prefix /opt/cli --no-audit --no-fund --loglevel=error \
      yaml@2.9.0 ajv@8.18.0 tsx@4.23.15 >/dev/null
    cli() { NODE_PATH=/opt/cli/node_modules /opt/cli/node_modules/.bin/tsx mods/common/src/config/cli/index.ts "$@"; }
    cli init --dir .dev --host-ip "$HOST_IP" >/dev/null
    cli render --dir .dev --config-dir .dev/config --env-file .dev/.env \
      --overlay .devcontainer/config --overlay .dev/overlay
    chown -R "$HOST_UID:$HOST_GID" .dev
  ' || die "fonoster-config init failed"
log "done: secrets in $DEV/.env, service config in $DEV/config"
