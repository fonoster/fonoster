FROM alpine:3.21
LABEL team="Fonoster Team <team@fonoster.com>"

COPY config /etc/asterisk/
COPY run.sh /
COPY sounds/ /var/lib/asterisk/sounds/en

RUN apk add --no-cache --update asterisk asterisk-curl tini \
 && chmod +x /run.sh \
 && chown -R asterisk:asterisk /etc/asterisk \
 && chown asterisk:asterisk /run.sh

USER asterisk:asterisk

# Re-mapping the signal from 143 to 0
ENTRYPOINT ["tini", "-v", "-e", "143", "--"]
CMD ["/run.sh"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["sh", "-c", "asterisk -rx 'core show uptime' | grep uptime"]