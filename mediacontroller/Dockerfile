FROM node:9-alpine
LABEL Pedro Sanders <fonosterteam@fonoster.com>

COPY yaps /yaps
COPY run.sh /
RUN apk add --update sox python make g++ && cd /yaps && npm i && chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
