FROM fonoster/base
COPY . /scripts
RUN ./install.sh
RUN link /usr/bin/run_apps /usr/bin/run \
  && link /usr/bin/healthcheck_apps /usr/bin/healthcheck
USER root
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]