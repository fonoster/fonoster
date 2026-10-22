# The Fonoster dev container's workspace: Node 22 and the code generators. The dependencies
# (Postgres, NATS, Routr, RTPEngine, MinIO, Envoy) are separate services (compose.yaml).
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

# protoc + well-known types for `npm run generate:protos` (the plugins come from node_modules/.bin),
# openssl for Prisma.
RUN apt-get update \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get install -y --no-install-recommends protobuf-compiler libprotobuf-dev openssl \
  && rm -rf /var/lib/apt/lists/*

# OpenSpec CLI used by the /opsx workflows (openspec/ and .claude/commands/opsx)
RUN npm install -g @fission-ai/openspec@1.4.1 && npm cache clean --force
