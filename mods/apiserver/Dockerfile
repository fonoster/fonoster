##
# Build stage
##
FROM node:22-slim AS builder 
LABEL team="Fonoster Team <team@fonoster.com>"

WORKDIR /work

ENV DOCKERIZE_VERSION=v0.7.0
COPY package.json package-lock.json lerna.json ./
COPY mods ./mods
COPY tsconfig.json ./
COPY .scripts ./.scripts

RUN --mount=type=cache,target=/root/.npm \
    apt-get update && apt-get install -y git wget \
    && npm ci --prefer-offline --no-audit \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN npm run build

RUN cd mods/apiserver \
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
  && rm -rf dockerize-linux-amd64-"$DOCKERIZE_VERSION".tar.gz mods/apiserver/*.tgz

# Clean up unnecessary files from node_modules to reduce size
RUN cd /usr/local/lib/node_modules/@fonoster/apiserver/node_modules && \
  find . -name "*.map" -type f -delete 2>/dev/null || true && \
  find . -name "*.test.js" -o -name "*.test.ts" -o -name "*.spec.js" -o -name "*.spec.ts" -type f -delete 2>/dev/null || true && \
  find . -type d \( -name "test" -o -name "tests" -o -name "__tests__" -o -name ".github" -o -name ".nyc_output" -o -name "coverage" -o -name "docs" -o -name "examples" \) -exec rm -rf {} + 2>/dev/null || true && \
  find . -name "*.md" -o -name "LICENSE" -o -name "CHANGELOG*" -type f -delete 2>/dev/null || true && \
  find . -name "*.ts" -not -path "*/node_modules/@types/*" -type f -delete 2>/dev/null || true && \
  cd /work && \
  rm -rf node_modules mods/*/node_modules mods/*/dist mods/*/.nyc_output mods/*/coverage 2>/dev/null || true

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
CMD ["sh", "-c", "DB_HOST=$(echo $APISERVER_DATABASE_URL | sed -n 's/.*@\\([^:/]*\\)[:/].*/\\1/p') && DB_PORT=$(echo $APISERVER_DATABASE_URL | sed -n 's/.*:\\([0-9]*\\)\\/.*/\\1/p') && if [ -z \"$DB_PORT\" ]; then DB_PORT=5432; fi && dockerize -wait tcp://${DB_HOST}:${DB_PORT} -timeout 30s && cd /service/core && npx prisma migrate deploy && cd /service/identity && npx prisma migrate deploy && node /usr/local/lib/node_modules/@fonoster/apiserver/dist/core/seed.js && node /usr/local/lib/node_modules/@fonoster/apiserver/dist/index.js"]