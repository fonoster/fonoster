##
## Build and pack the service
##
FROM fonoster/base as builder

COPY . /scripts
RUN ./install.sh

##
## Runner
##
FROM fonoster/base as runner

COPY --from=builder /scripts/fonoster-* .

RUN apk add --no-cache --update git tini npm nodejs python3 make g++ \
  && npm install -g fonoster-*.tgz \
  && apk del npm git python3 make g++

USER fonoster

CMD ["run_funcs"]

HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD [ "healthcheck_funcs" ]