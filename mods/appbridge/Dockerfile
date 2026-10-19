##
# Build stage: only AppBridge and the workspace packages it needs
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
# openssl lets `prisma generate` pick the runtime's engine (openssl 3).
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/callrecord ./mods/callrecord
COPY mods/identity-client ./mods/identity-client
# Vendor adapters (@fonoster/community/<vendor>).
COPY mods/community ./mods/community
# AMD (add-roomr 4.3, AO-B2): the classifier and its ONNX model run in AppBridge.
COPY mods/amd ./mods/amd
COPY mods/appbridge ./mods/appbridge
# The apiserver schema: `appStore.source: database`, the database registry and webhooks read the
# control-plane database through a client generated from it.
COPY mods/apiserver/schema.prisma ./mods/apiserver/schema.prisma

# Only AppBridge's workspace closure is installed (not the whole monorepo).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/appbridge --ignore-scripts --no-audit --no-fund

RUN for p in types logger common callrecord identity-client community amd appbridge; do \
      (cd mods/$p && npx tsc -b); \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/appbridge \
  && npx -y prisma@6.19.3 generate --schema mods/apiserver/schema.prisma \
  && find node_modules -name "*.map" -type f -delete

##
# Run stage
##
FROM node:22-slim

# openssl: the Prisma query engine needs libssl to load. /var/lib/fonoster/records holds call
# records being written (config callRecord.dir), owned by AppBridge's user: a named volume
# mounted there starts with this ownership.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser \
  && mkdir -p /var/lib/fonoster/records && chown -R appuser:appuser /var/lib/fonoster

WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods/types/package.json /work/mods/types/
COPY --from=builder --chown=appuser:appuser /work/mods/types/dist /work/mods/types/dist
COPY --from=builder --chown=appuser:appuser /work/mods/logger/package.json /work/mods/logger/
COPY --from=builder --chown=appuser:appuser /work/mods/logger/dist /work/mods/logger/dist
COPY --from=builder --chown=appuser:appuser /work/mods/common/package.json /work/mods/common/
COPY --from=builder --chown=appuser:appuser /work/mods/common/dist /work/mods/common/dist
COPY --from=builder --chown=appuser:appuser /work/mods/callrecord/package.json /work/mods/callrecord/
COPY --from=builder --chown=appuser:appuser /work/mods/callrecord/dist /work/mods/callrecord/dist
# identity-client loads its .proto at runtime, so the package is copied whole.
COPY --from=builder --chown=appuser:appuser /work/mods/identity-client /work/mods/identity-client
COPY --from=builder --chown=appuser:appuser /work/mods/community/package.json /work/mods/community/
COPY --from=builder --chown=appuser:appuser /work/mods/community/dist /work/mods/community/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/package.json /work/mods/amd/
COPY --from=builder --chown=appuser:appuser /work/mods/amd/dist /work/mods/amd/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/amd-model /work/mods/amd/amd-model
COPY --from=builder --chown=appuser:appuser /work/mods/appbridge/package.json /work/mods/appbridge/
COPY --from=builder --chown=appuser:appuser /work/mods/appbridge/dist /work/mods/appbridge/dist

USER appuser

# One YAML file, no .env (PL5). Mount it here or point APPBRIDGE_CONFIG elsewhere.
# The config file: /config/appbridge.yaml, else /etc/fonoster/appbridge.yaml (or APPBRIDGE_CONFIG).
# Session HTTP endpoint (config http.port); AppBridge also needs NATS reachable.
EXPOSE 8080

CMD ["node", "/work/mods/appbridge/dist/main.js"]
