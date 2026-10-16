##
# Build stage: only the gateway and the workspace packages it needs
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
# AMD (add-media-node 4.3, AO-B2): the classifier and its ONNX model run in the gateway.
COPY mods/streams ./mods/streams
COPY mods/amd ./mods/amd
COPY mods/gateway ./mods/gateway
# The apiserver schema: `appStore.source: database`, the database registry and webhooks read the
# control-plane database through a client generated from it.
COPY mods/apiserver/schema.prisma ./mods/apiserver/schema.prisma

# Only the gateway's workspace closure is installed (not the whole monorepo).
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/gateway --ignore-scripts --no-audit --no-fund

RUN for p in types logger common callrecord identity-client community streams amd gateway; do \
      (cd mods/$p && npx tsc -b); \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/gateway \
  && npx -y prisma@6.19.3 generate --schema mods/apiserver/schema.prisma \
  && find node_modules -name "*.map" -type f -delete

##
# Run stage
##
FROM node:22-slim

# openssl: the Prisma query engine needs libssl to load.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

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
COPY --from=builder --chown=appuser:appuser /work/mods/streams/package.json /work/mods/streams/
COPY --from=builder --chown=appuser:appuser /work/mods/streams/dist /work/mods/streams/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/package.json /work/mods/amd/
COPY --from=builder --chown=appuser:appuser /work/mods/amd/dist /work/mods/amd/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/amd-model /work/mods/amd/amd-model
COPY --from=builder --chown=appuser:appuser /work/mods/gateway/package.json /work/mods/gateway/
COPY --from=builder --chown=appuser:appuser /work/mods/gateway/dist /work/mods/gateway/dist

USER appuser

# One YAML file, no .env (PL5). Mount it here or point GATEWAY_CONFIG elsewhere.
ENV GATEWAY_CONFIG=/etc/fonoster/gateway.yaml
# Session HTTP endpoint (config http.port); the gateway also needs NATS reachable.
EXPOSE 8080

CMD ["node", "/work/mods/gateway/dist/main.js"]
