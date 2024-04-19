FROM alpine:3.19
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

COPY asterisk/config /etc/asterisk/
COPY asterisk/run.sh /

RUN apk add --no-cache --update tini asterisk asterisk-speex asterisk-curl nodejs npm git \
 && chmod +x /run.sh \
 && apk del --purge npm git

ENTRYPOINT ["tini", "-v", "--"]
CMD ["/run.sh"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD asterisk -rx "core show uptime" | grep uptime