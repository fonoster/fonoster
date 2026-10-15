##
# Hosted Autopilot session engine (add-platform): a session app the gateway dials.
# Build from the repository root:  docker build -f mods/autopilot/Dockerfile .
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
# openssl lets `prisma generate` pick the runtime's engine (openssl 3).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods ./mods

RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/autopilot --include-workspace-root --ignore-scripts --no-audit --no-fund

# Stops on the first package that fails to compile (failures used to be ignored).
RUN for p in types logger common voice autopilot; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/autopilot --include-workspace-root

# `source: database` (assistants, catalog, workspace vendor keys) reads the apiserver's database
# through a client generated from its schema, with the field-encryption extension (FN-B1).
# Installed aside (not into the workspace tree) and merged without overwriting anything.
RUN --mount=type=cache,target=/root/.npm \
    mkdir -p /opt/db && cd /opt/db && echo '{"private":true}' > package.json \
  && npm install --ignore-scripts --no-audit --no-fund \
      @prisma/client@6.19.2 prisma-field-encryption@1.6.0 prisma@6.19.3 \
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
ENV AUTOPILOT_SESSION_CONFIG=/etc/fonoster/autopilot-session.yaml
EXPOSE 3000

CMD ["node", "/work/mods/autopilot/dist/session/main.js"]
