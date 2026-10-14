# Fonoster dev container: Node workspace + tooling only.
# Telephony infra (Asterisk, RTPEngine, Routr, ...) runs on the host via compose.
FROM mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm

# protoc + well-known types (google/protobuf/*.proto) for `npm run generate:protos` (plugins come from node_modules/.bin)
RUN apt-get update \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get install -y --no-install-recommends protobuf-compiler libprotobuf-dev openssl \
  && rm -rf /var/lib/apt/lists/*

# OpenSpec CLI used by the /opsx workflows (see openspec/ and .claude/commands/opsx)
RUN npm install -g @fission-ai/openspec@1.4.1 && npm cache clean --force
