##
# Hosted Autopilot session engine (add-platform): a session app the gateway dials.
# Build from the repository root:  docker build -f mods/autopilot/Dockerfile .
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work

COPY package.json package-lock.json lerna.json tsconfig.json ./
COPY mods ./mods

RUN --mount=type=cache,target=/root/.npm \
    npm install --workspace @fonoster/autopilot --ignore-scripts --no-audit --no-fund

# The SDK's own postbuild moves dist/node/src up; autopilot compiles against that layout.
RUN for p in types logger common; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && (cd mods/sdk && npx tsc -b && mv dist/node/src/* dist/node/ && rm -rf dist/node/src \
      dist/node/generated && cp -a src/generated dist/node/generated/) \
  && for p in voice autopilot; do (cd mods/$p && npx tsc -b) || exit 1; done \
  && cp -a mods/common/src/protos mods/common/dist/ \
  && npm prune --omit=dev --workspace @fonoster/autopilot

FROM node:22-slim

RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser
WORKDIR /work
COPY --from=builder --chown=appuser:appuser /work/node_modules ./node_modules
COPY --from=builder --chown=appuser:appuser /work/package.json ./package.json
COPY --from=builder --chown=appuser:appuser /work/mods ./mods

USER appuser
ENV AUTOPILOT_SESSION_CONFIG=/etc/fonoster/autopilot-session.yaml
EXPOSE 3000

CMD ["node", "/work/mods/autopilot/dist/session/main.js"]
