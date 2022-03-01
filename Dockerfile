##
## Dependencies
##
FROM fonoster/base AS deps
WORKDIR /work

LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

# Install dependencies and set permissions
RUN apk add --no-cache --update git curl docker docker-compose openssl bash \
  && curl -qL -o /usr/bin/netdiscover https://github.com/CyCoreSystems/netdiscover/releases/download/v1.2.5/netdiscover.linux.amd64 \
  && chmod +x /usr/bin/netdiscover

##
## Stage
##
FROM deps AS stage
WORKDIR /work

# Copy relevant files
COPY . /work/fonoster

# Copy configuration files
RUN mkdir -p docker operator config \
  && touch config/config config/user_credentials \
  && cp -r fonoster/docker . \
  && cp -a fonoster/operator/compose/* operator \
  && mv operator/env_example operator/.env \
  && cp fonoster/etc/rbac.json config \
  && cp fonoster/etc/log4j2.yml config \
  && cp fonoster/etc/bootstrap.yml config \
  && cp fonoster/etc/redis.conf config \
  && cp fonoster/etc/service_envs.json config \
  && cp fonoster/install.sh . \
  && cp fonoster/update.sh . \
  && rm -rf fonoster

##
## Serve
##
FROM stage AS serve
WORKDIR /work

COPY --from=stage /work/install.sh /work/update.sh ./
COPY --from=stage /work/docker /work/docker

RUN find . -type f -iname "*.sh" -exec chmod +x {} + \
  && mv /work/install.sh /install.sh \
  && mv /work/update.sh /update.sh \
  && mv /work/docker /docker \
  && chown -R fonoster:fonoster /work

ENTRYPOINT [ "/install.sh" ]
