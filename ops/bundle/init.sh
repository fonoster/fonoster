#!/bin/sh
# Prepares this folder for `docker compose up -d`: .env with generated secrets, the signing keys,
# a certificate for getting started and the SIP port in config/routr-edgeport.yaml. Needs only a
# POSIX shell and openssl.
#
#   ./init.sh [--dir <folder>] [--host-ip <address>] [-h]
#
# Run it again any time: it keeps every value, key, certificate and config file, adds the .env
# names a newer release brings and prints how to reach the install. It never prints a secret.
set -eu

FONOSTER_VERSION=0.0.0

usage() {
  cat <<'EOF'
Usage: ./init.sh [--dir <folder>] [--host-ip <address>]

Writes .env (generated secrets), config/keys and config/tls when missing, sets the SIP port in
config/routr-edgeport.yaml, and prints the dashboard URL and how to create the first user. Keeps everything
that is already there.

  --dir <folder>        the install folder (default: this script's folder)
  --host-ip <address>   the address softphones and browsers reach this machine at (default:
                        the one in .env, else detected)
EOF
}

fail() {
  printf 'init: %s\n' "$*" >&2
  exit 1
}

DIR="$(cd "$(dirname "$0")" && pwd)"
HOST_IP_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
  --dir)
    [ $# -ge 2 ] || { usage >&2; exit 2; }
    DIR="$2"
    shift 2
    ;;
  --host-ip)
    [ $# -ge 2 ] || { usage >&2; exit 2; }
    HOST_IP_ARG="$2"
    shift 2
    ;;
  -h | --help)
    usage
    exit 0
    ;;
  *)
    usage >&2
    exit 2
    ;;
  esac
done

command -v openssl >/dev/null 2>&1 || fail "openssl not found. Install it (Debian/Ubuntu: sudo apt install openssl; macOS: brew install openssl), then run ./init.sh again. Nothing was written."
[ -d "$DIR/config" ] || fail "no config/ folder in $DIR"
DIR="$(cd "$DIR" && pwd)"
CONFIG="$DIR/config"
ENV_FILE="$DIR/.env"
umask 077

# Values ----------------------------------------------------------------------------------------

# The .env a new install starts from: every name and its default. A newer release appends the
# names it adds to an existing .env.
env_template() {
  cat <<EOF
# Docker Compose settings for this install, written by ./init.sh. Running it again keeps every
# value and adds the names a newer release introduces.
#
# Fonoster services don't read this file: Compose passes its values to their containers
# (env_file), where config/*.yaml reference them as \${NAME}. Change a value here, then recreate
# the containers (docker compose up -d --force-recreate).

# The Fonoster images (fonoster/<service>:<version>).
FONOSTER_VERSION=$FONOSTER_VERSION
COMPOSE_PROJECT_NAME=fonoster

# The address softphones, carriers and browsers reach this machine at (./init.sh --host-ip).
HOST_IP=
# The dashboard and API (gRPC, gRPC-Web, /api and /sip) over HTTPS on HTTPS_PORT, with a redirect
# on HTTPS_REDIRECT_PORT. HTTPS_BIND=127.0.0.1 publishes them on this machine only.
HTTPS_PORT=443
HTTPS_REDIRECT_PORT=80
# HTTPS_BIND=0.0.0.0
# The dashboard and API as browsers reach them. Add :<HTTPS_PORT> when it isn't 443.
PUBLIC_URL=https://\${HOST_IP}
# Your certificate (PEM: Let's Encrypt's fullchain.pem and privkey.pem). Unset, Envoy serves the
# certificate ./init.sh generates in config/tls/ for getting started: browsers warn once and API
# clients trust config/tls/ca.pem (--ca-file). Set both before going live, with PUBLIC_URL on the
# certificate's domain, then docker compose up -d.
# TLS_CERT=/etc/letsencrypt/live/voice.example.com/fullchain.pem
# TLS_KEY=/etc/letsencrypt/live/voice.example.com/privkey.pem
# Plain HTTP instead, for a TLS proxy in front: uncomment these lines (compose.http.yaml serves
# HTTP_PORT, on this machine only with HTTP_BIND=127.0.0.1) and set PUBLIC_URL to the proxy's
# https:// address.
# COMPOSE_FILE=compose.yaml:compose.http.yaml
# HTTP_BIND=127.0.0.1
HTTP_PORT=8449
# Other browser origins that may call the API (CORS), comma-separated; the dashboard is served on
# PUBLIC_URL and needs none. Unset: none.
# CORS_ALLOWED_ORIGINS=https://app.example.com
# SIP (UDP and TCP).
SIP_PORT=5060
# RTP for carriers and softphones (RTPEngine) and the Roomr node's range.
RTPENGINE_PORT_MIN=10000
RTPENGINE_PORT_MAX=10999
ROOMR_RTP_PORT_MIN=11000
ROOMR_RTP_PORT_MAX=11999
# Host-only ports: MinIO (call records) and NATS.
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001
NATS_PORT=4222
# Your OpenTelemetry collector's OTLP/HTTP endpoint (e.g. http://collector.example.com:4318);
# empty sends no telemetry. Every Fonoster service reads it as telemetry.otlpEndpoint.
OTEL_EXPORTER_OTLP_ENDPOINT=
# Headers a hosted collector needs (Grafana Cloud, Honeycomb, ...), as key=value,key=value
# (e.g. Authorization=Basic%20...). Treat it as a secret: keep this file private.
OTEL_EXPORTER_OTLP_HEADERS=
# Optional; the services export OTLP over HTTP (http/json), so leave empty or http/protobuf.
OTEL_EXPORTER_OTLP_PROTOCOL=
# The containers' private network (<prefix>.0/24). Change it if it collides with one of yours.
SUBNET_PREFIX=10.216.30

# Generated secrets. Keep a backup of this file: the encryption key protects stored vendor keys.
POSTGRES_PASSWORD=
MINIO_ROOT_USER=fonoster
MINIO_ROOT_PASSWORD=
NATS_APISERVER_PASSWORD=
NATS_APPBRIDGE_PASSWORD=
NATS_ROOMR_PASSWORD=
NATS_ROUTR_PASSWORD=
NATS_BILLING_PASSWORD=
ENCRYPTION_KEY=
AUTOPILOT_SIGNING_SECRET=
ROOMR_PASSWORD=

# A private region (COMPOSE_FILE=compose.yaml:compose.region.yaml): the region agent's NATS user
# and the key of its secrets store.
NATS_REGION_AGENT_PASSWORD=
FONOSTER_REGION_SECRETS_KEY=
EOF
}

# The value generated for an empty secret line, or nothing when the name is not a secret.
# Passwords start with a letter: NATS parses a variable's value as config, and one starting with a
# digit fails to load.
secret_for() {
  case "$1" in
  ENCRYPTION_KEY) printf 'k1.aesgcm256.%s=' "$(openssl rand -base64 32 | tr '+/' '-_' | tr -d '=\n')" ;;
  AUTOPILOT_SIGNING_SECRET) openssl rand -hex 24 ;;
  *_PASSWORD | *_SECRET | *_KEY | *_TOKEN) printf 's%s' "$(openssl rand -hex 16)" ;;
  esac
}

# The last value of NAME in a .env file (quotes around the whole value removed).
env_value() {
  awk -v n="$1" '
    /^[[:space:]]*#/ { next }
    { line = $0; sub(/^[[:space:]]*(export[[:space:]]+)?/, "", line) }
    index(line, n "=") == 1 { v = substr(line, length(n) + 2); found = 1 }
    END {
      if (!found) exit
      if (v ~ /^".*"$/ || v ~ /^\047.*\047$/) v = substr(v, 2, length(v) - 2)
      print v
    }
  ' "$2"
}

# NAME's value with ${OTHER} and ${OTHER:-default} expanded from the same file, one level deep
# (PUBLIC_URL=https://${HOST_IP}:${HTTPS_PORT}).
env_expanded() {
  v="$(env_value "$1" "$ENV_FILE")"
  while :; do
    case "$v" in
    *'${'*'}'*) ;;
    *) break ;;
    esac
    ref="${v#*\$\{}"
    ref="${ref%%\}*}"
    name="${ref%%:-*}"
    dflt=""
    [ "$name" = "$ref" ] || dflt="${ref#*:-}"
    val="$(env_value "$name" "$ENV_FILE")"
    [ -n "$val" ] || val="$dflt"
    before="${v%%\$\{*}"
    after="${v#*\$\{$ref\}}"
    v="$before$val$after"
  done
  printf '%s' "$v"
}

is_address() {
  printf '%s' "$1" | grep -Eq '^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$|^[0-9a-fA-F:]+$'
}

# The address of the default route's interface.
detect_host_ip() {
  ip=""
  if command -v ipconfig >/dev/null 2>&1 && command -v route >/dev/null 2>&1; then
    ifc="$(route -n get default 2>/dev/null | awk '/interface:/ {print $2}')"
    [ -z "$ifc" ] || ip="$(ipconfig getifaddr "$ifc" 2>/dev/null || true)"
  fi
  if [ -z "$ip" ] && command -v ip >/dev/null 2>&1; then
    ip="$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{for (i = 1; i < NF; i++) if ($i == "src") {print $(i + 1); exit}}')"
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  fi
  printf '%s' "$ip"
}

# Writes stdin to FILE through a temporary file in the same folder, so an interrupted run never
# leaves a half-written file.
write_file() {
  tmp="$1.init.$$"
  cat >"$tmp" && chmod "$2" "$tmp" && mv -f "$tmp" "$1"
}

# .env ------------------------------------------------------------------------------------------

[ -z "$HOST_IP_ARG" ] || is_address "$HOST_IP_ARG" || fail "--host-ip \"$HOST_IP_ARG\" is not an address"

kept_ip=""
[ ! -f "$ENV_FILE" ] || kept_ip="$(env_value HOST_IP "$ENV_FILE")"
host_ip="${HOST_IP_ARG:-${kept_ip:-$(detect_host_ip)}}"
[ -n "$host_ip" ] || fail "could not find this machine's address: pass --host-ip"

# Each line of the existing .env (or the template) as it is, except HOST_IP and an empty secret;
# then the template's names the file lacks.
new_env="$(mktemp "$DIR/.env.new.XXXXXX")"
trap 'rm -f "$new_env" "$DIR"/.env.new.* "$CONFIG"/tls/*.init.* "$CONFIG"/tls/new-server-key.* "$CONFIG"/tls/*.cnf "$CONFIG"/tls/*.csr' EXIT
if [ -f "$ENV_FILE" ]; then
  env_template >"$new_env.template"
  source_env="$ENV_FILE"
else
  env_template >"$new_env.template"
  source_env="$new_env.template"
fi

generated=0
added=""
while IFS= read -r line || [ -n "$line" ]; do
  case "$line" in
  HOST_IP=*) line="HOST_IP=$host_ip" ;;
  # The images of this release: an upgrade copies the old .env next to the new init.sh. The
  # repository's copy (0.0.0) leaves the dev container's and the stack's as they are.
  FONOSTER_VERSION=*) [ "$FONOSTER_VERSION" = 0.0.0 ] || line="FONOSTER_VERSION=$FONOSTER_VERSION" ;;
  *=)
    # Only an empty value: a generated one may end in = too (ENCRYPTION_KEY).
    name="${line%%=*}"
    value=""
    if [ "$line" = "$name=" ] && printf '%s' "$name" | grep -Eq '^[A-Za-z_][A-Za-z0-9_]*$'; then
      value="$(secret_for "$name")"
    fi
    if [ -n "$value" ]; then
      line="$name=$value"
      generated=$((generated + 1))
    fi
    ;;
  esac
  printf '%s\n' "$line"
done <"$source_env" >"$new_env"

if [ "$source_env" = "$ENV_FILE" ]; then
  header=0
  for name in $(sed -n 's/^\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' "$new_env.template"); do
    grep -Eq "^[[:space:]]*(export[[:space:]]+)?$name=" "$ENV_FILE" && continue
    if [ "$header" = 0 ]; then
      printf '\n# Added by init.sh (%s)\n' "$(date -u +%Y-%m-%d)" >>"$new_env"
      header=1
    fi
    default="$(env_value "$name" "$new_env.template")"
    [ "$name" != HOST_IP ] || default="$host_ip"
    [ -n "$default" ] || default="$(secret_for "$name")"
    printf '%s=%s\n' "$name" "$default" >>"$new_env"
    added="${added:+$added, }$name"
  done
fi
rm -f "$new_env.template"

if [ ! -f "$ENV_FILE" ]; then
  env_msg=".env written ($generated secrets generated)"
  write_file "$ENV_FILE" 0600 <"$new_env"
elif cmp -s "$new_env" "$ENV_FILE"; then
  env_msg=".env kept"
else
  env_msg=".env kept"
  [ -z "$added" ] || env_msg="$env_msg; added $added"
  [ "$generated" = 0 ] || env_msg="$env_msg; generated $generated empty secrets"
  [ "$kept_ip" = "$host_ip" ] || [ -z "$kept_ip" ] || env_msg="$env_msg; HOST_IP $kept_ip -> $host_ip"
  kept_version="$(env_value FONOSTER_VERSION "$ENV_FILE")"
  [ "$FONOSTER_VERSION" = 0.0.0 ] || [ "$kept_version" = "$FONOSTER_VERSION" ] \
    || env_msg="$env_msg; FONOSTER_VERSION $kept_version -> $FONOSTER_VERSION"
  write_file "$ENV_FILE" 0600 <"$new_env"
fi
chmod 0600 "$ENV_FILE"

# Keys ------------------------------------------------------------------------------------------

# config/ holds keys: only the owner may list it. The files inside are readable by the containers,
# which run as other users and reach them through their bind mounts.
chmod 0700 "$CONFIG"
KEYS="$CONFIG/keys"
mkdir -p "$KEYS"
chmod 0755 "$KEYS"
created=0
if [ ! -f "$KEYS/private.pem" ]; then
  openssl genrsa 2048 2>/dev/null | openssl pkcs8 -topk8 -nocrypt | write_file "$KEYS/private.pem" 0644
  openssl pkey -in "$KEYS/private.pem" -pubout | write_file "$KEYS/public.pem" 0644
  created=$((created + 2))
elif [ ! -f "$KEYS/public.pem" ]; then
  openssl pkey -in "$KEYS/private.pem" -pubout | write_file "$KEYS/public.pem" 0644
  created=$((created + 1))
fi
if [ ! -f "$KEYS/records.pem" ]; then
  openssl ecparam -name prime256v1 -genkey -noout 2>/dev/null | openssl pkcs8 -topk8 -nocrypt | write_file "$KEYS/records.pem" 0644
  created=$((created + 1))
fi
if [ "$created" = 0 ]; then keys_msg="keys: kept"; else keys_msg="keys: $created files created in config/keys"; fi

# Certificate for getting started ----------------------------------------------------------------

PUBLIC_URL="$(env_expanded PUBLIC_URL)"
TLS_CERT="$(env_expanded TLS_CERT)"
TLS_KEY="$(env_expanded TLS_KEY)"
# PUBLIC_URL's host: no scheme, path or port; an IPv6 address without its brackets.
public_host=""
case "$PUBLIC_URL" in
*://*)
  public_host="${PUBLIC_URL#*://}"
  public_host="${public_host%%/*}"
  case "$public_host" in
  \[*)
    public_host="${public_host#\[}"
    public_host="${public_host%%\]*}"
    ;;
  *) public_host="${public_host%%:*}" ;;
  esac
  ;;
esac

# localhost, 127.0.0.1, HOST_IP and PUBLIC_URL's host, lowercased, each once, in that order.
cert_names() {
  printf '%s\n' localhost 127.0.0.1 "$host_ip" "$public_host" | tr 'A-Z' 'a-z' | awk 'NF && !seen[$0]++'
}

# The names a server certificate covers, one per line, as cert_names writes them.
covered_names() {
  openssl x509 -in "$1" -noout -text 2>/dev/null | awk '
    /Subject Alternative Name/ { getline; gsub(/ /, ""); n = split($0, a, ","); for (i = 1; i <= n; i++) { sub(/^(DNS|IPAddress):/, "", a[i]); print tolower(a[i]) } }'
}

san_line() {
  cert_names | awk '{ if ($0 ~ /^[0-9.]+$/ || $0 ~ /:/) t = "IP"; else t = "DNS"; printf "%s%s:%s", (NR > 1 ? "," : ""), t, $0 }'
}

TLS="$CONFIG/tls"
if [ -n "$TLS_CERT" ] && [ -n "$TLS_KEY" ]; then
  tls_msg="tls: using TLS_CERT and TLS_KEY"
  tls_generated=0
else
  tls_generated=1
  mkdir -p "$TLS"
  chmod 0755 "$TLS"
  state=kept
  if [ ! -f "$TLS/ca.pem" ] || [ ! -f "$TLS/ca-key.pem" ]; then
    cat >"$TLS/ca.cnf" <<'EOF'
[req]
distinguished_name = dn
prompt = no
[dn]
CN = Fonoster local CA
[ca]
basicConstraints = critical, CA:TRUE
keyUsage = critical, keyCertSign, cRLSign
subjectKeyIdentifier = hash
EOF
    openssl ecparam -name prime256v1 -genkey -noout 2>/dev/null | openssl pkcs8 -topk8 -nocrypt | write_file "$TLS/ca-key.pem" 0600
    openssl req -new -x509 -key "$TLS/ca-key.pem" -days 3650 -config "$TLS/ca.cnf" -extensions ca \
      -set_serial "0x$(openssl rand -hex 8)" 2>/dev/null | write_file "$TLS/ca.pem" 0644
    state=created
  fi
  reissue=0
  if [ "$state" = created ] || [ ! -f "$TLS/server.pem" ] || [ ! -f "$TLS/server-key.pem" ]; then
    reissue=1
  elif ! openssl verify -CAfile "$TLS/ca.pem" "$TLS/server.pem" >/dev/null 2>&1; then
    reissue=1
  elif ! openssl x509 -in "$TLS/server.pem" -noout -checkend $((30 * 86400)) >/dev/null 2>&1; then
    reissue=1
  elif [ "$(covered_names "$TLS/server.pem" | sort)" != "$(cert_names | sort)" ]; then
    reissue=1
  fi
  if [ "$reissue" = 1 ]; then
    cat >"$TLS/server.cnf" <<EOF
[req]
distinguished_name = dn
prompt = no
[dn]
CN = $(cert_names | head -n 1)
[server]
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth
subjectAltName = $(san_line)
EOF
    openssl ecparam -name prime256v1 -genkey -noout 2>/dev/null | openssl pkcs8 -topk8 -nocrypt >"$TLS/new-server-key.$$"
    openssl req -new -key "$TLS/new-server-key.$$" -config "$TLS/server.cnf" -out "$TLS/server.csr" 2>/dev/null
    openssl x509 -req -in "$TLS/server.csr" -CA "$TLS/ca.pem" -CAkey "$TLS/ca-key.pem" -days 397 \
      -set_serial "0x$(openssl rand -hex 8)" -extfile "$TLS/server.cnf" -extensions server 2>/dev/null \
      | write_file "$TLS/server.pem" 0644
    # Routr's image reads the server key as uid 5000 to build its SIP over TLS keystore: a bind
    # mount bypasses config/'s 0700 but not the file's own mode. The CA key stays 0600.
    write_file "$TLS/server-key.pem" 0644 <"$TLS/new-server-key.$$"
    rm -f "$TLS/new-server-key.$$" "$TLS/server.csr"
    [ "$state" = created ] || state=reissued
  fi
  rm -f "$TLS/ca.cnf" "$TLS/server.cnf"
  names="$(cert_names | paste -sd, - | sed 's/,/, /g')"
  case "$state" in
  created) tls_msg="tls: local CA and server certificate created in config/tls for $names (for getting started)" ;;
  reissued) tls_msg="tls: server certificate reissued in config/tls for $names (for getting started)" ;;
  *) tls_msg="tls: kept (config/tls)" ;;
  esac
fi

# SIP port --------------------------------------------------------------------------------------

# The port of the tcp and udp entries under spec.transport, found by structure: the file may have
# been merged and re-serialised (keys in another order, no comments).
SIP_PORT="$(env_expanded SIP_PORT)"
SIP_PORT="${SIP_PORT:-5060}"
EDGEPORT="$CONFIG/routr-edgeport.yaml"
config_msg=""
if [ -f "$EDGEPORT" ]; then
  awk -v port="$SIP_PORT" '
    function indent(s) { match(s, /^ */); return RLENGTH }
    function flush(   i, proto) {
      proto = ""
      for (i = 1; i <= n; i++) if (item[i] ~ /^[ -]*protocol:[ ]*.?(tcp|udp).?[ ]*$/) proto = "sip"
      for (i = 1; i <= n; i++) {
        if (proto == "sip" && item[i] ~ /^[ -]*port:/) sub(/port:.*/, "port: " port, item[i])
        print item[i]
      }
      n = 0
    }
    {
      if (inside) {
        blank = ($0 ~ /^[ ]*(#.*)?$/)
        if (!blank && (indent($0) < t || (indent($0) == t && $0 !~ /^ *- /))) { flush(); inside = 0 }
        else {
          if ($0 ~ /^ *- / && n > 0 && !blank) flush()
          item[++n] = $0
          next
        }
      }
      if ($0 ~ /^ *transport:[ ]*$/ && spec) { inside = 1; t = indent($0); n = 0; print; next }
      if ($0 ~ /^spec:/) spec = 1
      else if ($0 ~ /^[^ #]/) spec = 0
      print
    }
    END { if (inside) flush() }
  ' "$EDGEPORT" >"$EDGEPORT.init.$$"
  if cmp -s "$EDGEPORT.init.$$" "$EDGEPORT"; then
    rm -f "$EDGEPORT.init.$$"
  else
    chmod 0644 "$EDGEPORT.init.$$" && mv -f "$EDGEPORT.init.$$" "$EDGEPORT"
  fi
  config_msg="config: config/routr-edgeport.yaml SIP port $SIP_PORT"
fi

# Summary ---------------------------------------------------------------------------------------

HTTPS_PORT="$(env_expanded HTTPS_PORT)"
HTTPS_PORT="${HTTPS_PORT:-443}"
HTTP_PORT="$(env_expanded HTTP_PORT)"
HTTP_PORT="${HTTP_PORT:-8449}"
case ":$(env_expanded COMPOSE_FILE):" in
*:compose.http.yaml:*) api="$host_ip:$HTTP_PORT (gRPC and gRPC-Web, plain HTTP)" ;;
*) api="${public_host:-$host_ip}:$HTTPS_PORT (gRPC and gRPC-Web, TLS)" ;;
esac

# Plain HTTP on an address the internet reaches sends logins and API keys in the clear.
case "$PUBLIC_URL" in
http://*)
  case "$public_host" in
  localhost | 127.* | 10.* | 192.168.* | 172.1[6-9].* | 172.2[0-9].* | 172.3[01].*) ;;
  *) echo "init: warning: PUBLIC_URL is $PUBLIC_URL: the dashboard and API go over plain HTTP. For HTTPS, set PUBLIC_URL to https:// (https://docs.fonoster.com/self-hosting/https)." >&2 ;;
  esac
  ;;
esac

echo "$env_msg"
echo "$keys_msg"
echo "$tls_msg"
[ -z "$config_msg" ] || echo "$config_msg"
echo "host address: $host_ip"
echo
echo "Dashboard   ${PUBLIC_URL:-https://$host_ip}"
echo "API         $api"
echo "SIP         $host_ip:$SIP_PORT (UDP and TCP)"
echo
echo "Files       $ENV_FILE            Compose settings and the generated secrets (back it up)"
echo "            $CONFIG/         one file per service, yours to edit"
echo "            $KEYS/    signing keys"
if [ "$tls_generated" = 1 ]; then
  echo "            $TLS/     certificate generated for getting started"
  echo
  echo "Certificate $TLS/ca.pem"
  echo "            SHA-256 $(openssl x509 -in "$TLS/ca.pem" -noout -fingerprint -sha256 | sed 's/^[^=]*=//')"
  echo "            Generated for getting started: browsers show a warning once, and API clients"
  echo "            trust this CA file (--ca-file, or FONOSTER_CA_FILE). Use a real certificate"
  echo "            (TLS_CERT and TLS_KEY) before going live: https://docs.fonoster.com/self-hosting/https"
fi
echo
echo "Next: docker compose up -d"
echo "Then, once: put a password in a file only you can read, and create the first user with it:"
echo "  (umask 077; openssl rand -hex 16 > owner.pw)"
echo "  docker compose exec -T apiserver fonoster-owner create you@example.com < owner.pw"
echo "Run ./init.sh again any time to print this. It keeps every secret."
