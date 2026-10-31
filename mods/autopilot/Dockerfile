##
# Hosted Autopilot session engine (add-platform): a session app AppBridge dials.
# Build from the repository root:  docker build -f mods/autopilot/Dockerfile .
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
# openssl lets `prisma generate` pick the runtime's engine (openssl 3).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Manifests before sources, so the install layer is reused until package-lock.json or one of
# these package.json files changes.
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types/package.json ./mods/types/
COPY mods/logger/package.json ./mods/logger/
COPY mods/common/package.json ./mods/common/
COPY mods/voice/package.json ./mods/voice/
COPY mods/community/package.json ./mods/community/
COPY mods/autopilot/package.json ./mods/autopilot/

# Only Autopilot's workspace closure; no @fonoster package may come from the registry except roomr
# (a package.json missing above would).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/autopilot --include-workspace-root --ignore-scripts --no-audit --no-fund \
  && for d in node_modules/@fonoster/*; do [ -L "$d" ] || [ "${d##*/}" = roomr ] || { echo "$d came from the npm registry, not the workspace"; exit 1; }; done \
  && ls mods/*/package.json > /tmp/install-manifests

# autopilot's `tsc -b` also builds community (a project reference).
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/voice ./mods/voice
COPY mods/community ./mods/community
COPY mods/autopilot ./mods/autopilot
COPY mods/apiserver/schema.prisma ./mods/apiserver/schema.prisma
# A package.json that came only with the sources would leave the install layer blind to it.
RUN [ "$(ls mods/*/package.json)" = "$(cat /tmp/install-manifests)" ] \
  || { echo "copy each mods/<package>/package.json before npm install"; exit 1; }

# Stops on the first package that fails to compile (failures used to be ignored).
RUN for p in types logger common voice autopilot; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/autopilot --include-workspace-root

# `source: database` (agents, catalog, workspace vendor keys) reads the apiserver's database
# through a client generated from its schema, with the field-encryption extension (FN-B1).
# Installed aside (not into the workspace tree) and merged without overwriting anything.
RUN --mount=type=cache,target=/root/.npm \
    mkdir -p /opt/db && cd /opt/db && echo '{"private":true}' > package.json \
  && npm install --ignore-scripts --no-audit --no-fund \
      @prisma/client@6.19.3 prisma-field-encryption@1.6.0 prisma@6.19.3 \
  && npx prisma generate --schema /work/mods/apiserver/schema.prisma \
  && rm -rf node_modules/prisma node_modules/@prisma/engines node_modules/.bin \
  && cp -an node_modules/. /work/node_modules/

FROM node:22-slim

# openssl: the Prisma query engine needs libssl to load.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods ./mods

USER appuser
# The config file: /config/autopilot.yaml (or --config / AUTOPILOT_SESSION_CONFIG).
EXPOSE 3000

CMD ["node", "/work/mods/autopilot/dist/session/main.js"]
