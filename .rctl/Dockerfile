FROM openjdk:13-ea-alpine3.10
MAINTAINER Pedro Sanders <fonosterteam@fonoster.com>

RUN apk add --update nodejs npm bash netcat-openbsd \
  && npm -g install routr-ctl \
  && rm -rf /var/cache/apk/* /tmp/* /var/tmp/*
