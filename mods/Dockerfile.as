FROM node:9-alpine
LABEL Pedro Sanders <fonosterteam@fonoster.com>

COPY . /mods
COPY etc/run-as.sh /run.sh
RUN apk add --update python git make g++; \
  cd /mods ; \
  npm install lerna -g ; \
  rm *\package-lock.json ; \ 
  lerna clean -y ; \
  lerna bootstrap ; \
  apk del python git make g++ ; \
  rm -rf /var/cache/apk/* ; \
  chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
