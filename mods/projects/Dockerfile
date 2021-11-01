FROM fonoster/base
COPY . /scripts
RUN ./install.sh
RUN link /usr/bin/run_projects /usr/bin/run \
  && link /usr/bin/healthcheck_projects /usr/bin/healthcheck
USER fonoster
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]
