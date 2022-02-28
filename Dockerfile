FROM fonoster/base
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

# Build example: 
# docker build --no-cache \
#   --build-arg BRANCH=dev \
#   --build-arg FONOSTER_VERSION=0.2.20 \
#   --tag fonoster/fonoster:0.2.20 .

ARG FONOSTER_VERSION=0.2.20
ENV FONOSTER_VERSION=$FONOSTER_VERSION

WORKDIR /work

# Copy project files to /work
COPY . /work/fonoster

# Install dependencies
RUN apk add --no-cache --update git curl docker docker-compose openssl bash

# Install Netdiscover
RUN curl -qL -o /usr/bin/netdiscover https://github.com/CyCoreSystems/netdiscover/releases/download/v1.2.5/netdiscover.linux.amd64

# Set permissions for netdiscover
RUN chmod +x /usr/bin/netdiscover

# Create necessary directories
RUN mkdir -p docker operator config

# Create config and credentials files
RUN touch config/config config/user_credentials

# Copy docker-backed infrastructure management
RUN cp -r fonoster/docker .

# Copy services and scripts for operator
RUN cp -a fonoster/operator/compose/* operator

# Sets environment variables
RUN mv operator/env_example operator/.env

# Create config file for your instance from fonoster
RUN cp fonoster/etc/rbac.json config \
  && cp fonoster/etc/log4j2.yml config \
  && cp fonoster/etc/bootstrap.yml config \
  && cp fonoster/etc/redis.conf config \
  && cp fonoster/etc/service_envs.json config \
  && cp fonoster/install.sh . \
  && cp fonoster/update.sh . \
  && rm -rf fonoster

# Sets permissions for all scripts
RUN find . -type f -iname "*.sh" -exec chmod +x {} +

# Move scrips to root
RUN mv /work/install.sh /install.sh \
  && mv /work/update.sh /update.sh \
  && mv /work/docker /docker \
  && chown -R fonoster:fonoster /work

ENTRYPOINT [ "/install.sh" ]
