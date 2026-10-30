#!/bin/sh
# Writes the dev config in .dev/: the bundle's config files with the dev layer in
# .devcontainer/config/ and your own in .dev/overlay/ merged over them
# (ops/rebuild/merge-config.cjs), then ops/bundle/init.sh (the self-host installer), which generates
# the secrets, keys and certificate and sets the SIP port. Secrets stay in .dev/, never committed.
#
#   .devcontainer/initialize.sh             on the host, each time the editor starts the dev
#                                           container (initializeCommand); rewrites .dev/ only
#                                           when .dev/config/tls/server.pem or
#                                           .dev/config/routr-rtprelay.yaml is missing (otherwise
#                                           run npm run dev:config); needs only a POSIX shell and
#                                           Docker
#   .devcontainer/initialize.sh --refresh   inside the workspace (npm run dev:config): merge the
#                                           bundle's files and the overlays again, then init.sh,
#                                           which adds new names; every secret is kept
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

# The merged Routr files, each with its checksum: taken before a refresh and compared after it, to
# name the ones that changed. The running Routr keeps its old image and mounts until it is
# recreated on the host, which the workspace has no Docker to do.
routr_sums() {
  for f in "$DEV"/config/routr-*.yaml; do
    [ -f "$f" ] && printf '%s %s\n' "$(basename "$f")" "$(cksum < "$f")"
  done
  return 0
}

hint_routr_recreate() {
  changed=""
  for f in "$DEV"/config/routr-*.yaml; do
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

# An existing .dev/ is kept (npm run dev:config writes it again).
if [ "$MODE" = "host" ] && [ -f "$DEV/.env" ]; then
  detected="${FONOSTER_DEV_HOST_IP:-$(detect_host_ip)}"
  [ -z "$detected" ] || printf '%s\n' "$detected" > "$DEV/host-ip.detected"
  warn_stale_host_ip
  log "keeping $DEV (npm run dev:config writes it again)"
  exit 0
fi

# .dev/.env when it is missing: the dev values (and FONOSTER_DEV_<NAME> overrides). init.sh keeps
# them, adds every other name with its default and generates the secrets.
seed_env() {
  [ -f "$DEV/.env" ] && return 0
  mkdir -p "$DEV"
  awk -v config_dir="$DEV/config" '
    BEGIN {
      dev["COMPOSE_PROJECT_NAME"] = "fonoster-dev"
      # Apart from a self-hosted install on the same machine (10.216.30).
      dev["SUBNET_PREFIX"] = "10.216.31"
      # HTTPS on 8449 with the certificate init.sh generates in .dev/config/tls/ (browsers warn
      # once; the workspace trusts its CA through FONOSTER_CA_FILE). The redirect on 8448.
      dev["HTTPS_PORT"] = "8449"
      dev["HTTPS_REDIRECT_PORT"] = "8448"
      dev["HTTP_PORT"] = "18449"
      dev["PUBLIC_URL"] = "https://localhost:${HTTPS_PORT}"
      for (k in ENVIRON)
        if (k ~ /^FONOSTER_DEV_/ && k != "FONOSTER_DEV_HOST_IP") dev[substr(k, 14)] = ENVIRON[k]
      for (k in dev) print k "=" dev[k]
      print ""
      print "# The dev container: where Compose finds the merged config (absolute, on the host)."
      print "CONFIG_DIR=" config_dir
      print "# The first user npm run dev creates (fonoster-owner); init.sh generates the password."
      print "DEV_OWNER_EMAIL=admin@fonoster.local"
      print "DEV_OWNER_PASSWORD="
    }
  ' > "$DEV/.env"
  chmod 600 "$DEV/.env"
}

seed_env

if [ "$MODE" = "--refresh" ]; then
  # Inside the workspace: its Node and the repository's yaml package.
  warn_stale_host_ip
  cd "$ROOT"
  node ops/rebuild/merge-config.cjs "$BUNDLE/config" "$DEV/config" .devcontainer/config .dev/overlay >/dev/null
  sh "$BUNDLE/init.sh" --dir "$DEV" ${FONOSTER_DEV_HOST_IP:+--host-ip "$FONOSTER_DEV_HOST_IP"} >/dev/null
  log "wrote $DEV (secrets kept)"
  hint_routr_recreate "$routr_before"
  exit 0
fi

command -v docker >/dev/null 2>&1 || die "Docker is required"
command -v openssl >/dev/null 2>&1 || die "openssl is required"
host_ip="${FONOSTER_DEV_HOST_IP:-$(detect_host_ip)}"
[ -n "$host_ip" ] || die "could not find this machine's LAN address: set FONOSTER_DEV_HOST_IP and reopen"

# The merge needs Node and yaml: a throwaway container, so the host needs neither.
log "writing $DEV (host address $host_ip)"
docker run --rm --quiet -v "$ROOT:/src" -w /src -e NPM_CONFIG_UPDATE_NOTIFIER=false \
  -e HOST_UID="$(id -u)" -e HOST_GID="$(id -g)" \
  node:22-alpine sh -ec '
    npm install --prefix /opt/merge --no-audit --no-fund --loglevel=error yaml@2.9.0 >/dev/null
    NODE_PATH=/opt/merge/node_modules node ops/rebuild/merge-config.cjs ops/bundle/config .dev/config \
      .devcontainer/config .dev/overlay >/dev/null
    chown -R "$HOST_UID:$HOST_GID" .dev
  ' || die "could not merge the dev config"
# init.sh on the host: a POSIX shell and openssl (LibreSSL on macOS is enough).
sh "$BUNDLE/init.sh" --dir "$DEV" --host-ip "$host_ip" >/dev/null || die "ops/bundle/init.sh failed"
log "done: secrets in $DEV/.env, service config in $DEV/config"
