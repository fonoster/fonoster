##
# The API server (with its embedded Identity) built from this checkout's workspace packages, for
# the rebuild stack (ops/rebuild). The release image (mods/apiserver/Dockerfile) installs
# @fonoster/* from npm, which does not have the unreleased rebuild packages (ST-B2).
#
#   docker build -f ops/rebuild/docker/apiserver.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY .scripts ./.scripts
COPY mods ./mods

# Only the apiserver's workspace closure (not the whole monorepo).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/apiserver --ignore-scripts --no-audit --no-fund

RUN npx prisma generate --schema mods/apiserver/schema.prisma \
  && npx prisma generate --schema mods/identity/schema.prisma

# The SDK's own postbuild moves dist/node/src up; autopilot compiles against that layout.
RUN for p in types logger common identity authz streams sipnet callrecord; do \
      (cd mods/$p && npx tsc -b) || exit 1; \
    done \
  && (cd mods/sdk && npx tsc -b && mv dist/node/src/* dist/node/ && rm -rf dist/node/src \
      dist/node/generated && cp -a src/generated dist/node/generated/) \
  && for p in voice autopilot apiserver; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && node .scripts/copy-hbs.cjs \
  && sh .scripts/copy-prisma-clients.sh

##
# Run stage
##
FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g prisma@6.19.3 \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods ./mods

# Where the entrypoint looks for migrations (--migrations-root /service).
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/migrations /service/core/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma /service/core/schema.prisma
COPY --from=builder --chown=appuser:appuser /work/mods/identity/migrations /service/identity/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/identity/schema.prisma /service/identity/schema.prisma

USER appuser
WORKDIR /service

# Reads /opt/fonoster/fonoster.yaml, waits for Postgres, applies the core and identity
# migrations, seeds, then starts.
CMD ["node", "/work/mods/apiserver/dist/bin/entrypoint.js", "--migrations-root", "/service"]
