FROM fonoster/base
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

# Build example: 
# docker build --no-cache \
#   --build-arg BRANCH=dev \
#   --build-arg FONOSTER_VERSION=0.2.20 \
#   --tag fonoster/fonoster:0.2.20 .

ARG FONOSTER_VERSION=0.2.20
ARG BRANCH=main
ENV FONOSTER_VERSION=$FONOSTER_VERSION
ENV BRANCH=$BRANCH

WORKDIR /work

RUN apk add --no-cache --update git curl docker docker-compose openssl bash\
  && git clone https://github.com/fonoster/fonoster --depth=1 -b $BRANCH --single-branch \
  && curl -qL -o /usr/bin/netdiscover https://github.com/CyCoreSystems/netdiscover/releases/download/v1.2.5/netdiscover.linux.amd64 \
  && chmod +x /usr/bin/netdiscover \
  && mkdir -p operator config \
  && touch config/config config/user_credentials \
  && cp -a fonoster/operator/compose/* operator \
  && mv operator/env_example operator/.env \
  && cp fonoster/etc/rbac.json config \
  && cp fonoster/etc/log4j2.yml config \
  && cp fonoster/etc/bootstrap.yml config \
  && cp fonoster/etc/redis.conf config \
  && cp fonoster/etc/service_envs.json config \
  && cp fonoster/install.sh . \
  && rm -rf fonoster \
  && find . -type f -iname "*.sh" -exec chmod +x {} + \
  && mv /work/install.sh /install.sh \
  && chown -R fonoster:fonoster /work 

ENTRYPOINT [ "/install.sh" ]
