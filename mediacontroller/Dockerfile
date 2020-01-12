FROM node:8.15.0-alpine
LABEL Pedro Sanders <fonosterteam@fonoster.com>

COPY yaps /yaps
COPY run.sh /
RUN apk add --update python make g++ && cd /yaps/dispatcher && npm i && chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
