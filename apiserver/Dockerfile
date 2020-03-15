FROM node:9-alpine
LABEL Pedro Sanders <fonosterteam@fonoster.com>

COPY mods /mods
COPY run.sh /
RUN apk add --update python make g++; \
  cd /mods/core ; \
  npm install ; \
  chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
