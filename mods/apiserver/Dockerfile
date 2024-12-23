##
# Build stage
##
FROM node:20-alpine3.19 AS builder 
LABEL Fonoster Team <team@fonoster.com>

WORKDIR /work
COPY . .

ENV DOCKERIZE_VERSION v0.7.0

# Manually install rollup and nx for arm64 for compatibility
RUN apk add --no-cache --update git \
  && npm install \
  && npm run build \
  && cd mods/apiserver \
  && npm pack \
  && npm install -g $(ls *.tgz) \
  && cp /work/mods/apiserver/schema.prisma /usr/local/lib/node_modules/@fonoster/apiserver/ \
  && cp /work/mods/identity/schema.prisma /usr/local/lib/node_modules/@fonoster/apiserver/node_modules/@fonoster/identity/ \
  && cd /usr/local/lib/node_modules/@fonoster/apiserver/ \
  && npx prisma generate \
  && cd /usr/local/lib/node_modules/@fonoster/apiserver/node_modules/@fonoster/identity/ \
  && npx prisma generate \
  && wget https://github.com/jwilder/dockerize/releases/download/"$DOCKERIZE_VERSION"/dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && rm -rf dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz $(ls *.tgz)

##
# Run stage
##
FROM node:20-alpine3.19

RUN addgroup -g 1001 appuser && adduser -u 1001 -G appuser -D appuser 

WORKDIR /service

COPY --from=builder --chown=appuser:appuser /usr/local/lib/node_modules/@fonoster/apiserver /usr/local/lib/node_modules/@fonoster/apiserver
COPY --from=builder --chown=appuser:appuser /usr/local/bin/dockerize /usr/local/bin/dockerize
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/migrations ./core/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma ./core/schema.prisma
COPY --from=builder --chown=appuser:appuser /work/mods/identity/migrations ./identity/migrations
COPY --from=builder --chown=appuser:appuser /work/mods/identity/schema.prisma ./identity/schema.prisma

RUN npm install -g prisma@6.1.0 npm@latest 

USER appuser

# TODO: Fix hardcode host for db
CMD sh -c "dockerize -wait tcp://postgres:5432 -timeout 30s && \
  cd /service/core && \
  npx prisma migrate deploy && \
  cd /service/identity && \
  npx prisma migrate deploy && \
  node /usr/local/lib/node_modules/@fonoster/apiserver/dist/core/seed.js && \
  node /usr/local/lib/node_modules/@fonoster/apiserver/dist/index.js"
