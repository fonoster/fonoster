FROM alpine:3.18
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

COPY asterisk/config /etc/asterisk/
COPY asterisk/run.sh /

RUN apk add --no-cache --update tini asterisk asterisk-speex asterisk-curl nodejs npm git \
 && npm install -g @fonoster/dispatcher \
 && chmod +x /run.sh \
 && apk del --purge npm git

ENTRYPOINT ["tini", "-v", "--"]
CMD ["/run.sh"]

HEALTHCHECK --interval=5s --timeout=3s \
  CMD ((asterisk -rx "core show uptime" | grep uptime) \
  && (asterisk -rx "ari show apps" | grep -q "mediacontroller")) || exit 1