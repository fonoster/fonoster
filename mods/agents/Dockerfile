FROM fonoster/base
COPY . /scripts
RUN ./install.sh; \
  link /usr/local/bin/run_agents /usr/local/bin/run; \
  link /usr/local/bin/healthcheck_agents /usr/local/bin/healthcheck
USER fonoster
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]
