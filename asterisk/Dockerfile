FROM alpine:3.19
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

COPY asterisk/config /etc/asterisk/
COPY asterisk/run.sh /

RUN apk add --no-cache --update tini asterisk asterisk-curl nodejs npm git \
 && chmod +x /run.sh \
 && chown -R asterisk:asterisk /etc/asterisk \
 && chown asterisk:asterisk /run.sh \
 && apk del --purge npm git

USER asterisk:asterisk

# Re-mapping the signal from 143 to 0
ENTRYPOINT ["tini", "-v", "-e", "143", "--"]
CMD ["/run.sh"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD asterisk -rx "core show uptime" | grep uptime