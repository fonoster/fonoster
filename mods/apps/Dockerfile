FROM fonoster/base
COPY . /scripts
RUN ./install.sh; \
  link /usr/local/bin/run_apps /usr/local/bin/run; \
  link /usr/local/bin/healthcheck_apps /usr/local/bin/healthcheck
USER root
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]