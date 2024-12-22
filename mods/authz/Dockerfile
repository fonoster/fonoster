##
# Build stage
##
FROM node:20-slim AS builder
LABEL Fonoster Team <team@fonoster.com>

WORKDIR /work
COPY . .

RUN npm rebuild

##
# Run stage
##
FROM node:20-slim

RUN groupadd -r appuser && useradd -r -g appuser -m -d /home/appuser appuser

COPY --from=builder --chown=appuser:appuser /work/mods/authz/dist /home/appuser/authz/dist
COPY --from=builder --chown=appuser:appuser /work/mods/authz/package.json /home/appuser/authz/package.json
COPY --from=builder --chown=appuser:appuser /work/mods/authz/node_modules /home/appuser/authz/node_modules
WORKDIR /home/appuser/authz

USER appuser

CMD ["node", "/home/appuser/authz/dist/server.js"]
