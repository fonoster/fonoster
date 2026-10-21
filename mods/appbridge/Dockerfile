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

# identity-client's .proto is copied from @fonoster/common by its prebuild (git-ignored), which
# `tsc -b` skips: without this every AppBridge built from a clean checkout crashed at start.
RUN node mods/identity-client/scripts/sync-proto.mjs \
  && for p in types logger common callrecord identity-client community amd appbridge; do \
      (cd mods/$p && npx tsc -b); \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/appbridge \
  && npx -y prisma@6.19.3 generate --schema mods/apiserver/schema.prisma \
  && find node_modules -name "*.map" -type f -delete \
  && for p in types logger common callrecord community amd appbridge; do \
      mkdir -p mods/$p/node_modules; \
    done

# The ai-coustics Voice Focus model (apps' aiCoustics filter), fetched once here so AppBridge never
# downloads at call time (filter default modelDir ./models = /work/models). The SDK itself is an
# optional dependency of @fonoster/appbridge, installed above with the platform's binary.
RUN node -e "require('@ai-coustics/aic-sdk').Model.download('quail-vf-2.2-s-16khz', '/work/models').then((f) => console.log('model:', f))"

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
# Each package's own node_modules too: dependencies npm could not hoist to the root (community's
# ws 8 next to the root's ws 7) live there.
COPY --from=builder --chown=appuser:appuser /work/mods/types/package.json /work/mods/types/
COPY --from=builder --chown=appuser:appuser /work/mods/types/dist /work/mods/types/dist
COPY --from=builder --chown=appuser:appuser /work/mods/types/node_modules /work/mods/types/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/logger/package.json /work/mods/logger/
COPY --from=builder --chown=appuser:appuser /work/mods/logger/dist /work/mods/logger/dist
COPY --from=builder --chown=appuser:appuser /work/mods/logger/node_modules /work/mods/logger/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/common/package.json /work/mods/common/
COPY --from=builder --chown=appuser:appuser /work/mods/common/dist /work/mods/common/dist
COPY --from=builder --chown=appuser:appuser /work/mods/common/node_modules /work/mods/common/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/callrecord/package.json /work/mods/callrecord/
COPY --from=builder --chown=appuser:appuser /work/mods/callrecord/dist /work/mods/callrecord/dist
COPY --from=builder --chown=appuser:appuser /work/mods/callrecord/node_modules /work/mods/callrecord/node_modules
# identity-client loads its .proto at runtime, so the package is copied whole.
COPY --from=builder --chown=appuser:appuser /work/mods/identity-client /work/mods/identity-client
COPY --from=builder --chown=appuser:appuser /work/mods/community/package.json /work/mods/community/
COPY --from=builder --chown=appuser:appuser /work/mods/community/dist /work/mods/community/dist
COPY --from=builder --chown=appuser:appuser /work/mods/community/node_modules /work/mods/community/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/amd/package.json /work/mods/amd/
COPY --from=builder --chown=appuser:appuser /work/mods/amd/dist /work/mods/amd/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/node_modules /work/mods/amd/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/amd/amd-model /work/mods/amd/amd-model
COPY --from=builder --chown=appuser:appuser /work/mods/appbridge/package.json /work/mods/appbridge/
COPY --from=builder --chown=appuser:appuser /work/mods/appbridge/dist /work/mods/appbridge/dist
COPY --from=builder --chown=appuser:appuser /work/mods/appbridge/node_modules /work/mods/appbridge/node_modules
COPY --from=builder --chown=appuser:appuser /work/models /work/models

USER appuser

# The ai-coustics SDK reports errors to the vendor's PostHog unless told not to; authorization and
# usage metering (needed for the key) are separate and stay on.
ENV DO_NOT_TRACK=1

# Audio filters (the ai-coustics SDK) run on libuv's thread pool, which is shared with fs, dns
# and crypto; 4 threads by default. Raise it further for many filtered calls per instance.
ENV UV_THREADPOOL_SIZE=8

# One YAML file, no .env (PL5). Mount it here or point APPBRIDGE_CONFIG elsewhere.
# The config file: /config/appbridge.yaml, else /etc/fonoster/appbridge.yaml (or APPBRIDGE_CONFIG).
# Session HTTP endpoint (config http.port); AppBridge also needs NATS reachable.
EXPOSE 8080

CMD ["node", "/work/mods/appbridge/dist/main.js"]
