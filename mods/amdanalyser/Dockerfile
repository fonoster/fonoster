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

COPY --from=builder --chown=appuser:appuser /work/mods/amdanalyser/dist /home/appuser/amdanalyser/dist
COPY --from=builder --chown=appuser:appuser /work/mods/amdanalyser/package.json /home/appuser/amdanalyser/package.json
COPY --from=builder --chown=appuser:appuser /work/mods/amdanalyser/node_modules /home/appuser/amdanalyser/node_modules
COPY --from=builder --chown=appuser:appuser /work/mods/amdanalyser/amd-model /home/appuser/amdanalyser/amd-model

WORKDIR /home/appuser/amdanalyser

USER appuser

CMD ["node", "/home/appuser/amdanalyser/dist/server.js"]
