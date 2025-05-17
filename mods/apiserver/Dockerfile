##
# Build stage
##
FROM node:22-slim AS builder 
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work
COPY . .

ENV DOCKERIZE_VERSION=v0.7.0

RUN apt-get update && apt-get install -y git wget \ 
  && npm install \
  && npm run build \
  && cd mods/apiserver \
  && npm pack \
  && npm install -g $(ls *.tgz) \
  && cp schema.prisma /usr/local/lib/node_modules/@fonoster/apiserver/ \
  && npx prisma generate --schema /usr/local/lib/node_modules/@fonoster/apiserver/schema.prisma \
  && cd /work \
  && npx prisma generate --schema mods/identity/schema.prisma \
  && rm -rf /usr/local/lib/node_modules/@fonoster/apiserver/node_modules/@fonoster/identity/dist/generated \
  && mv mods/identity/src/generated /usr/local/lib/node_modules/@fonoster/apiserver/node_modules/@fonoster/identity/dist \
  && wget https://github.com/jwilder/dockerize/releases/download/"$DOCKERIZE_VERSION"/dockerize-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && rm -rf dockerize-linux-amd64-"$DOCKERIZE_VERSION".tar.gz $(ls *.tgz) \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

##
# Run stage
##
FROM node:22-slim

RUN groupadd -g 1001 appuser && useradd -u 1001 -g appuser -m appuser

WORKDIR /service

COPY --from=builder --chown=appuser:appuser /usr/local/lib/node_modules/@fonoster/apiserver /usr/local/lib/node_modules/@fonoster/apiserver
COPY --from=builder --chown=appuser:appuser /usr/local/bin/dockerize /usr/local/bin/dockerize
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/migrations ./core/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma ./core/schema.prisma
COPY --from=builder --chown=appuser:appuser /work/mods/identity/migrations ./identity/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/identity/schema.prisma ./identity/schema.prisma

RUN apt-get update && apt-get install -y ca-certificates \
  && npm install -g prisma@6.8.2 npm@latest \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

USER appuser

# Extract database host and port from APISERVER_DATABASE_URL environment variable
CMD DB_HOST=$(echo $APISERVER_DATABASE_URL | sed -n 's/.*@\([^:/]*\)[:/].*/\1/p') && \
  DB_PORT=$(echo $APISERVER_DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p') && \
  if [ -z "$DB_PORT" ]; then DB_PORT=5432; fi && \
  dockerize -wait tcp://${DB_HOST}:${DB_PORT} -timeout 30s && \
  cd /service/core && \
  npx prisma migrate deploy && \
  cd /service/identity && \
  npx prisma migrate deploy && \
  node /usr/local/lib/node_modules/@fonoster/apiserver/dist/core/seed.js && \
  node /usr/local/lib/node_modules/@fonoster/apiserver/dist/index.js