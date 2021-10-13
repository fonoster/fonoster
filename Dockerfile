FROM fonoster/base
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

# Build example: 
# docker build --no-cache \
#   --build-arg BRANCH=dev \
#   --build-arg FONOS_VERSION=0.1.24 \
#   --tag fonoster/fonos:0.1.27 .

ARG FONOS_VERSION=0.1.27
ARG BRANCH=main
ENV FONOS_VERSION=$FONOS_VERSION
ENV BRANCH=$BRANCH

WORKDIR /work

RUN apk add --no-cache --update git curl docker docker-compose openssl bash\
  && git clone https://github.com/fonoster/fonos --depth=1 -b $BRANCH --single-branch \
  && curl -qL -o /usr/bin/netdiscover https://github.com/CyCoreSystems/netdiscover/releases/download/v1.2.5/netdiscover.linux.amd64 \
  && chmod +x /usr/bin/netdiscover \
  && mkdir -p operator config \
  && touch config/config config/user_credentials \
  && cp -a fonos/operator/compose/* operator \
  && mv operator/env_example operator/.env \
  && cp fonos/etc/rbac.json config \
  && cp fonos/etc/log4j2.yml config \
  && cp fonos/etc/bootstrap.yml config \
  && cp fonos/etc/redis.conf config \
  && cp fonos/etc/service_envs.json config \
  && cp fonos/install.sh . \
  && rm -rf fonos \
  && find . -type f -iname "*.sh" -exec chmod +x {} + \
  && mv /work/install.sh /install.sh \
  && chown -R fonos:fonos /work 

ENTRYPOINT [ "/install.sh" ]
