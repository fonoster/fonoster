##
# Build stage
##
FROM node:22-slim AS builder
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
COPY . .

RUN npm install && npm run build

##
# Run stage
##
FROM node:22-slim

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY --from=builder --chown=appuser:appuser /work/mods/amd/dist /home/appuser/amd/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amd/package.json /home/appuser/amd/package.json
COPY --from=builder --chown=appuser:appuser /work/mods/amd/amd-model /home/appuser/amd/amd-model

WORKDIR /home/appuser/amd

# mods/amd has no dependency-version conflicts elsewhere in the workspace, so
# npm's hoisting leaves nothing under mods/amd/node_modules in the builder
# stage to copy (unlike mods/autopilot, which happens to nest one conflicting
# package there — that's why its Dockerfile's equivalent COPY works). Install
# the declared runtime deps from the registry instead, same mechanism
# autopilot's "npm install @fonoster/voice" workaround relies on.
RUN npm install --omit=dev

USER appuser

CMD ["node", "/home/appuser/amd/dist/server.js"]
