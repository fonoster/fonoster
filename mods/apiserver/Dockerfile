##
## Build and pack the service
##
FROM alpine:3.18 as builder
LABEL maintainer="Pedro Sanders <psanders@fonoster.com>"

WORKDIR /work
COPY mods/apiserver .

RUN apk add --no-cache git curl nodejs npm python3 make cmake g++ \
  && npm install --omit=dev

##  
## Runner
##
FROM alpine:3.18 as runner
ENV USER=fonoster
ENV GID=1000
ENV UID=1000
ENV HOME=/home/fonoster

WORKDIR /service

COPY --from=builder /work/dist dist
COPY --from=builder /work/node_modules node_modules
COPY --from=builder /work/package.json package.json
COPY ./mods/apiserver/etc/service_envs.json /home/fonoster/service_envs.json
COPY ./mods/apiserver/etc/rbac.json /home/fonoster/rbac.json

RUN apk add --no-cache --update tini nodejs \
  && echo "[]" > /home/fonoster/limiter.json \
  && rm -rf /var/cache/apk/*

RUN addgroup -g ${GID} ${USER} && adduser \
    --disabled-password \
    --gecos "" \
    --ingroup "$USER" \
    --home ${HOME} \
    --uid "$UID" \
    "$USER"

# Re-mapping the signal from 143 to 0
ENTRYPOINT ["tini", "-v", "-e", "143", "--"]
CMD ["node", "./dist/index"]
