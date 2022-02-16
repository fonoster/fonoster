FROM fonoster/base
COPY . /scripts
RUN ./install.sh; \ 
  link /usr/local/bin/run_funcs /usr/local/bin/run; \
  link /usr/local/bin/healthcheck_funcs /usr/local/bin/healthcheck
USER root
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]