FROM alpine:3.12
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

COPY asterisk/config /etc/asterisk/
COPY asterisk/run.sh /

RUN apk add --no-cache --update tini asterisk asterisk-speex asterisk-curl \
 && chmod +x /run.sh

ENTRYPOINT ["tini", "-v", "--"]
CMD ["/run.sh"]

HEALTHCHECK --interval=5s --timeout=3s \
  CMD asterisk -rx "core show uptime" | grep uptime || exit 1