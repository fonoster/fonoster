FROM fonoster/base
COPY . /scripts
RUN ./install.sh
RUN alias run="run_funcs" \
  && alias healthcheck="healthcheck_funcs"
USER root
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]