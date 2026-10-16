# The Fonoster dev container's workspace: Node 22, Go and the code generators. The dependencies
# (Postgres, NATS, Routr, RTPEngine, MinIO, Envoy) are separate services (compose.yaml).
FROM mcr.microsoft.com/devcontainers/typescript-node:1-22-bookworm

ARG TARGETARCH
# The media node's Go (go/medianode/go.mod). GOTOOLCHAIN=local: never download another one.
ARG GO_VERSION=1.25.5
ENV GOTOOLCHAIN=local \
    GOPATH=/home/node/go \
    PATH=/usr/local/go/bin:/home/node/go/bin:$PATH

# protoc + well-known types for `npm run generate:protos` (the plugins come from node_modules/.bin),
# openssl for Prisma, libopus for the media node (cgo).
RUN apt-get update \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get install -y --no-install-recommends protobuf-compiler libprotobuf-dev openssl libopus-dev \
  && rm -rf /var/lib/apt/lists/* \
  && curl -fsSL "https://go.dev/dl/go${GO_VERSION}.linux-${TARGETARCH:-amd64}.tar.gz" \
    | tar -C /usr/local -xz \
  && mkdir -p /home/node/go && chown -R node:node /home/node/go

# OpenSpec CLI used by the /opsx workflows (openspec/ and .claude/commands/opsx)
RUN npm install -g @fission-ai/openspec@1.4.1 && npm cache clean --force
