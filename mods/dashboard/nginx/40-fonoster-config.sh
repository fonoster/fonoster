#!/bin/sh
# Writes the dashboard's runtime settings from DASHBOARD_API_URL, the only
# variable it reads. Runs from the nginx image's /docker-entrypoint.d.
set -eu

HTML=/usr/share/nginx/html
CONF_DIR=/etc/nginx/fonoster
mkdir -p "$CONF_DIR"

API_URL="${DASHBOARD_API_URL:-}"
API_ORIGIN=""

if printf '%s' "$API_URL" | grep -Eq '^https?://[][A-Za-z0-9.:-]+(/[A-Za-z0-9._~/-]*)?$'; then
  API_URL="${API_URL%/}"
  API_ORIGIN=$(printf '%s' "$API_URL" | sed -E 's#^(https?://[^/]+).*#\1#')
  printf 'window.__FONOSTER__ = {"apiUrl":"%s"};\n' "$API_URL" > "$HTML/config.js"
  echo "fonoster-dashboard: API at $API_URL"
else
  # The page explains what's missing instead of failing to start.
  printf 'window.__FONOSTER__ = %s;\n' "$( [ -n "$API_URL" ] && printf '{"apiUrl":"invalid"}' || printf 'undefined' )" > "$HTML/config.js"
  echo "fonoster-dashboard: DASHBOARD_API_URL is missing or not an http(s) URL" >&2
fi

# connect-src allows wss: for the test-call SIP signaling server set in fonoster.yaml.
cat > "$CONF_DIR/security-headers.conf" <<CONF
add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://avatars.githubusercontent.com; font-src 'self'; connect-src 'self' ${API_ORIGIN} wss:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "same-origin" always;
CONF
