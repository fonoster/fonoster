##
# Fake TTS, STT and LLM providers (mods/conformance, PROVIDERS.md) as one service, so the rebuild
# stack runs calls without vendor keys. Test deployments only.
#
#   docker build -f ops/rebuild/docker/fakes.Dockerfile .
##
FROM node:22-slim AS builder
WORKDIR /work
COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods/conformance ./mods/conformance
RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/conformance --include-workspace-root --ignore-scripts --no-audit --no-fund
RUN cd mods/conformance && npx tsc -b \
  && cd /work && npm prune --omit=dev --workspace @fonoster/conformance --include-workspace-root

FROM node:22-slim
RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/conformance/package.json ./mods/conformance/package.json
COPY --from=builder --chown=appuser:appuser /work/mods/conformance/dist ./mods/conformance/dist
USER appuser
EXPOSE 7001 7002 7003
CMD ["node", "/work/mods/conformance/dist/fakes/serve.js"]
