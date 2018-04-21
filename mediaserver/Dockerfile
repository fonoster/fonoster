FROM alpine:edge
MAINTAINER Pedro Sanders <fonosterteam@fonoster.com>

COPY . /etc/asterisk/
COPY run.sh /
RUN apk add --update asterisk asterisk-sounds-en \
    && chmod +x /run.sh \
    && rm /etc/asterisk/Dockerfile /etc/asterisk/run.sh

EXPOSE 6060

CMD ["/bin/sh", "-c", "/run.sh"]
