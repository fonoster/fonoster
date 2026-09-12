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
COPY --from=builder --chown=appuser:appuser /work/mods/amd/node_modules /home/appuser/amd/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/amd/amd-model /home/appuser/amd/amd-model

WORKDIR /home/appuser/amd

USER appuser

CMD ["node", "/home/appuser/amd/dist/server.js"]
