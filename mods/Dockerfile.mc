FROM node:9-alpine
LABEL Pedro Sanders <fonosterteam@fonoster.com>

COPY . /mods
COPY etc/run-mc.sh /run.sh
RUN apk add --update sox python make g++; \
  cd /mods ; \
  npm install lerna -g; \
  lerna clean -y ; \
  lerna bootstrap ; \
  chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
