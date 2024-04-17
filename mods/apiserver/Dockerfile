##
# Build stage
##
FROM node:20-alpine3.19 AS builder 
LABEL Salt AI <psanders@fonoster.ai>

WORKDIR /work
COPY . .

ENV DOCKERIZE_VERSION v0.7.0

RUN apk add --no-cache --update git \
  && npm install \
  && npm run build \
  && cd mods/apiserver \
  && npm pack \
  && npm install -g addsalt-apiserver-*.tgz \
  && cp schema.prisma /usr/local/lib/node_modules/@addsalt/apiserver/ \
  && cd /usr/local/lib/node_modules/@addsalt/apiserver/ \
  && npx prisma generate \
  && wget https://github.com/jwilder/dockerize/releases/download/"$DOCKERIZE_VERSION"/dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && tar -C /usr/local/bin -xzvf dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz \
  && rm -rf dockerize-alpine-linux-amd64-"$DOCKERIZE_VERSION".tar.gz addsalt-apiserver-*

##
# Run stage
##
FROM node:20-alpine3.19

RUN addgroup -g 1001 appuser && adduser -u 1001 -G appuser -D appuser 

WORKDIR /service

COPY --from=builder --chown=appuser:appuser /usr/local/lib/node_modules/@addsalt/apiserver /usr/local/lib/node_modules/@addsalt/apiserver
COPY --from=builder --chown=appuser:appuser /usr/local/bin/dockerize /usr/local/bin/dockerize
COPY --from=builder --chown=appuser:appuser /work/mods/apiserver/schema.prisma .
COPY locales /service/locales

RUN npm install -g prisma@5.11.0 npm@latest 

USER appuser

# TODO: Fix hardcode host for db
CMD sh -c "dockerize -wait tcp://postgres:5432 -timeout 30s && \
  npx prisma migrate deploy && \
  node /usr/local/lib/node_modules/@addsalt/apiserver/dist/index.js"