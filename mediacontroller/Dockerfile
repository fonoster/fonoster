FROM node:8.15.0-alpine
MAINTAINER Pedro Sanders <fonosterteam@fonoster.com>

COPY dispatcher /dispatcher
COPY run.sh /
RUN apk add --update python make g++ && cd /dispatcher && npm i && chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
