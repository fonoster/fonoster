FROM alpine:3.9
LABEL maintainer="Pedro Sanders <fonosterteam@fonoster.com>"

COPY config /etc/asterisk/
COPY run.sh /
RUN apk add --update asterisk=15.7.4-r0 asterisk-sounds-en && chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
