##
# Standalone Fonoster Identity service.
#
# Configured entirely from a mounted JSON config file (no environment variables).
# Mount the config and keys at /service/config, e.g.:
#   docker run -v $PWD/config:/service/config:ro fonoster/identity
##

##
# Build stage
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
# openssl lets `prisma generate` pick the runtime's engine (openssl 3).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Manifests before sources, so the install layer is reused until package-lock.json or one of
# these package.json files changes. @fonoster/identity imports common, logger and types; nothing
# else of the workspace is built.
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types/package.json ./mods/types/
COPY mods/logger/package.json ./mods/logger/
COPY mods/common/package.json ./mods/common/
COPY mods/identity/package.json ./mods/identity/

# Only Identity's workspace closure. Its devDependency @fonoster/identity-client (tests only) is
# left as a dangling link (npm still fills mods/identity-client/node_modules from the lockfile, so
# that folder goes); no @fonoster package may come from the registry except roomr.
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/identity --include-workspace-root --ignore-scripts --no-audit --no-fund \
  && for d in node_modules/@fonoster/*; do [ -L "$d" ] || [ "${d##*/}" = roomr ] || { echo "$d came from the npm registry, not the workspace"; exit 1; }; done \
  && ls mods/*/package.json > /tmp/install-manifests \
  && rm -rf mods/identity-client

COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/identity ./mods/identity
# A package.json that came only with the sources would leave the install layer blind to it.
RUN [ "$(ls mods/*/package.json)" = "$(cat /tmp/install-manifests)" ] \
  || { echo "copy each mods/<package>/package.json before npm install"; exit 1; }

# The Prisma client goes where the runtime imports it (dist/generated, copy-assets.cjs).
RUN (cd mods/identity && npx prisma generate --schema schema.prisma) \
  && for p in types logger common identity; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && (cd mods/identity && node scripts/copy-assets.cjs)

##
# Run stage
##
FROM node:22-slim

RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

WORKDIR /service

# Hoisted workspace deps + the identity package and its workspace dependencies.
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/identity ./mods/identity
COPY --from=builder --chown=appuser:appuser /work/mods/common ./mods/common
COPY --from=builder --chown=appuser:appuser /work/mods/logger ./mods/logger
COPY --from=builder --chown=appuser:appuser /work/mods/types ./mods/types

RUN apt-get update && apt-get install -y ca-certificates \
    && npm install -g prisma@6.19.3 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER appuser

EXPOSE 50051

# Provision the database from the mounted config, then start the service.
# No environment variables — everything comes from /service/config/identity.json.
CMD ["sh", "-c", "cd /service/mods/identity && node scripts/db-provision.mjs --config /service/config/identity.json && node dist/server/index.js --config /service/config/identity.json"]
