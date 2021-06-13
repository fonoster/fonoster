FROM fonoster/base
COPY . /scripts
RUN ./install.sh
USER fonos
RUN alias run="run_numbers" \
  && alias healthcheck="healthcheck_numbers"
HEALTHCHECK --interval=30s \
  --timeout=30s \
  --start-period=5s \
  --retries=3 \
  CMD [ "healthcheck" ]
