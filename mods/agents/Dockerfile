FROM fonoster/base
COPY . /scripts
RUN ./install.sh
RUN link /usr/bin/run_agents /usr/bin/run \
  && link /usr/bin/healthcheck_agents /usr/bin/healthcheck
USER fonos
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]
