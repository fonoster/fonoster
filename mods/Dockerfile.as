# A newer version will cause issues with the "sync" dependencies
# Do not change without proper testing
FROM node:9-alpine
LABEL maintainer="Pedro Sanders <fonosterteam@fonoster.com>"

COPY . /mods
COPY etc/run-as.sh /run.sh
RUN apk add --update python git make g++; \
  cd /mods ; \
  npm config set unsafe-perm true ; \
  npm install lerna -g ; \
  npm run clean; \
  lerna bootstrap ; \
  apk del python git make g++ ; \
  rm -rf /var/cache/apk/* ; \
  chmod +x /run.sh

CMD ["/bin/sh", "-c", "/run.sh"]
