##
# Fake TTS, STT and LLM providers (mods/conformance, PROVIDERS.md) as one service, so the rebuild
# stack runs calls without vendor keys. Test deployments only.
#
#   docker build -f ops/rebuild/docker/fakes.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
COPY package.json package-lock.json lerna.json tsconfig.json ./
# @fonoster/conformance imports @fonoster/common (the fake Roomr node), which needs types and logger.
COPY mods/types ./mods/types
COPY mods/logger ./mods/logger
COPY mods/common ./mods/common
COPY mods/conformance ./mods/conformance
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/conformance --include-workspace-root --ignore-scripts --no-audit --no-fund
RUN for p in types logger common conformance; do \
      (cd mods/$p && npx tsc -b); \
    done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/conformance --include-workspace-root

FROM node:22-slim
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
# The workspace packages that node_modules links to.
COPY --from=builder --chown=appuser:appuser /work/mods ./mods
USER appuser
EXPOSE 7001 7002 7003 7004
CMD ["node", "/work/mods/conformance/dist/fakes/serve.js"]
