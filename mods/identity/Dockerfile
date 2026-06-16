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

COPY package.json package-lock.json lerna.json ./
COPY mods ./mods
COPY tsconfig.json ./
COPY .scripts ./.scripts

RUN --mount=type=cache,target=/root/.npm \
    apt-get update && apt-get install -y git \
    && npm install --prefer-offline --no-audit \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm run build

# Generate the Prisma client and place it where the runtime imports it (dist).
RUN npx prisma generate --schema mods/identity/schema.prisma \
    && rm -rf mods/identity/dist/generated \
    && cp -r mods/identity/src/generated mods/identity/dist/generated

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
    && npm install -g prisma@6.8.2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER appuser

EXPOSE 50051

# Provision the database from the mounted config, then start the service.
# No environment variables — everything comes from /service/config/identity.json.
CMD ["sh", "-c", "cd /service/mods/identity && node scripts/db-provision.mjs --config /service/config/identity.json && node dist/server/index.js --config /service/config/identity.json"]
